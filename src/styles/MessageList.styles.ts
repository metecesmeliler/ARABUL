import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    messageList: {
      padding: 10,
    },
    messageBubble: {
      maxWidth: "80%",
      borderRadius: 10,
      padding: 10,
      marginVertical: 5,
    },
    systemMessage: {
      backgroundColor: "#e0e0e0",
      alignSelf: "flex-start",
    },
    userMessage: {
      backgroundColor: "#dcf8c6",
      alignSelf: "flex-end",
    },
    messageText: {
      color: "#333",
    },
  });

  export default styles;
