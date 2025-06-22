import React from "react";
import { FlatList, View, Text, ListRenderItem } from "react-native";
import { Message } from "../types";
import styles from "../styles/MessageList.styles";

type Props = {
  messages: Message[];
  flatListRef: React.RefObject<FlatList<Message>>;
  renderMessage?: (message: Message) => React.ReactNode;
};

const MessageList: React.FC<Props> = ({ messages, flatListRef, renderMessage }) => {
  const defaultRenderMessage = (item: Message) => (
    <View style={[styles.messageBubble, item.sender === "user" ? styles.userMessage : styles.systemMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  // Define renderItem with the correct type annotation
  const renderItem: ListRenderItem<Message> = ({ item }) => {
    // If a custom render function is provided, use it
    if (renderMessage) {
      return <React.Fragment>{renderMessage(item)}</React.Fragment>;
    }
    // Otherwise, use the default rendering
    return defaultRenderMessage(item);
  };

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.messageList}
    />
  );
};

export default MessageList;
