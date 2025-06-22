import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  messageText: {
    color: "#333",
    fontSize: 16,
    lineHeight: 22,
  },
  messageList: {
    padding: 10,
    paddingBottom: 80,
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    alignSelf: "flex-start",
    elevation: 1,
  },
  systemMessage: {
    backgroundColor: "#e0e0e0",
    alignSelf: "flex-start",
  },
  userMessage: {
    backgroundColor: "#dcf8c6",
    alignSelf: "flex-end",
  },
  aiMessage: {
    backgroundColor: "#e6f2ff",
    alignSelf: "flex-start",
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  inputContainer: {
    backgroundColor: "white",
    borderTopColor: "#ddd",
    elevation: 3,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: "white",
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: "#ffad00",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignSelf: 'flex-end',
    marginBottom: 1,
  },
  sendButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  spinner: {
    marginVertical: 16,
  },
  naceOptionsContainer: {
    marginTop: 10,
  },
  naceCodeOption: {
    padding: 12,
    marginVertical: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  naceCodeText: {
    fontSize: 14,
    color: '#333',
  },
});

export default styles;
