import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Keyboard,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList, Message, NaceCode } from "../types";
import { useTranslation } from "react-i18next";
import styles from "../styles/ChatScreen.styles";
import MessageList from "../components/MessageList";
import MessageInput from "../components/MessageInput";
import CitySelectionModal from "../components/CitySelectionModal";
import { chatService } from "../api/chatApi";
import { getCurrentLocation } from "../services/locationService";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = StackScreenProps<RootStackParamList, "Chat">;

const ChatScreen: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [selectedNaceCode, setSelectedNaceCode] = useState<NaceCode | null>(null);
  const [spellSuggestion, setSpellSuggestion] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<Message>>(null!);

  useEffect(() => {
    setMessages([
      {
        id: "1",
        text: t("chat.welcome"),
        sender: "system",
        timestamp: Date.now(),
      },
    ]);
  }, [t]);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const NaceCodeOption: React.FC<{
    naceCode: NaceCode;
    onSelect: (naceCode: NaceCode) => void;
  }> = ({ naceCode, onSelect }) => {
    return (
      <TouchableOpacity
        style={styles.naceCodeOption}
        onPress={() => onSelect(naceCode)}
        testID={`nace-code-${naceCode.code}`}
      >
        <Text style={styles.naceCodeText}>{naceCode.description}</Text>
      </TouchableOpacity>
    );
  };

  const handleNaceCodeSelection = (naceCode: NaceCode) => {
    setSelectedNaceCode(naceCode);
    setMessages(prev => [
      ...prev,
      {
        id: `${Date.now()}-user-nace`,
        text: t("chat.selectedCategory", {
          description: naceCode.description
        }),
        sender: "system",
        timestamp: Date.now(),
      }
    ]);
    setModalVisible(true);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-user`,
        text: text.trim(),
        sender: "user",
        timestamp: Date.now(),
      }
    ]);

    setIsLoading(true);

    try {
      const response = await chatService.getNaceCodes(text.trim(), i18n.language);
      console.log("📦 Gelen NACE Kodları:", response.data);

      if (response.success && response.data && response.data.length > 0) {
        const naceMessage: Message = {
          id: `${Date.now()}-system-nace`,
          text: t("chat.selectCategory"),
          sender: "system",
          timestamp: Date.now(),
          naceOptions: response.data,
        };
        setMessages(prev => [...prev, naceMessage]);
      } else {
        let key: string;
        switch (response.data) {
          case "Semantic search failed":
            key = "chat.errorMessage";
            break;
          case "No results met the confidence threshold":
            key = "chat.thresholdMessage";
            break;
          default:
            key = "chat.errorMessage";
        }
        setMessages(prev => [
        ...prev,
        {
          id: `${Date.now()}-system`,
          text: t(key),
          sender: "system",
          timestamp: Date.now(),
        }
      ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-system`,
          text: t("chat.errorMessage"),
          sender: "system",
          timestamp: Date.now(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitySelection = async (cities: string[]) => {
    setModalVisible(false);
    setIsLoading(true);

    try {
      const userLoc = await getCurrentLocation();
      if (!userLoc) throw new Error("location");

      const requestData = {
        naceCode: selectedNaceCode ? selectedNaceCode.code : "",
        cities: cities.map((city) => ({ city })),
        latitude: userLoc.latitude,
        longitude: userLoc.longitude,
      };

      const response = await chatService.getBusinesses(requestData, "/chat/get_businesses");
      const naceEntries = response.data?.data;

      if (Array.isArray(naceEntries)) {
        naceEntries.forEach((entry: any, naceIndex: number) => {
          console.log(`📘 NACE ${naceIndex + 1}: ${entry.NaceCode} – ${entry.Sector}`);
          if (Array.isArray(entry.Suppliers)) {
            entry.Suppliers.forEach((supplier: any, index: number) => {
              console.log("🔍 Supplier Raw Data:", supplier);
              console.log(`🏢 ${index + 1}. ${supplier.name ?? "(No name)"} — ${supplier.description ?? "(No description)"}`);
            });
          } else {
            console.log("⚠️ No suppliers found for this NACE.");
          }
          console.log("--------------------------------------------------");
        });
      }

      if (response.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-system`,
            text: t("chat.readyForNextQuery"),
            sender: "system",
            timestamp: Date.now(),
          },
        ]);
        navigation.navigate("BusinessList", {
          jsonData: JSON.stringify(response.data),
          userLatitude: userLoc.latitude,
          userLongitude: userLoc.longitude,
        });
      } else {
        throw new Error("api-fail");
      }
    } catch (err) {
      const isLocationError = (err as Error).message === "location";
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-system`,
          text: t("chat.locationErrorMessage"),
          sender: "system",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
      setSelectedNaceCode(null);
    }
  };

  const renderMessage = (message: Message) => {
    const messageStyle = message.sender === "user" ? styles.userMessage : styles.systemMessage;
    return (
      <View style={[styles.messageBubble, messageStyle]}>
        <Text style={styles.messageText}>{message.text}</Text>
        {message.naceOptions && message.sender === "system" && (
          <View style={styles.naceOptionsContainer}>
            {message.naceOptions.map((naceCode) => (
              <NaceCodeOption
                key={naceCode.code}
                naceCode={naceCode}
                onSelect={handleNaceCodeSelection}
              />
            ))}
            <TouchableOpacity
              onPress={() => handleNaceRejection(message.id)}
              style={[styles.naceCodeOption, { backgroundColor: "#ffe6e6", marginTop: 8 }]}
            >
              <Text style={[styles.naceCodeText, { color: "red", fontWeight: "bold" }]}>{t('chat.naceCodeDislike')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const handleNaceRejection = (messageId: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-system-clarify`,
        text: t("chat.askAnotherQuery"),
        sender: "system",
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {isLoading && (
        <ActivityIndicator testID="loading-spinner" size="large" style={styles.spinner} />
      )}

      <KeyboardAvoidingView
        style={{ flex: 1, paddingBottom: insets.bottom }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined }
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : insets.bottom}
      >
        <MessageList
          messages={messages}
          flatListRef={flatListRef}
          renderMessage={renderMessage}
        />
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
        />
      </KeyboardAvoidingView>

      <CitySelectionModal
        visible={modalVisible}
        onSelectCities={handleCitySelection}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default ChatScreen;
