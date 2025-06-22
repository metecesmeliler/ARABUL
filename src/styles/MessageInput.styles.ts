import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    inputContainer: {
      flexDirection: "row",
      padding: 10,
      borderTopWidth: 1,
      borderColor: "#eee",
      backgroundColor: "#fff",
      alignItems: "center",
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 20,
      paddingHorizontal: 15,
      paddingVertical: 10,
      marginRight: 10,
      backgroundColor: "#f9f9f9",
      height: 40,
    },
    sendButton: {
      backgroundColor: "#ffad00",
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 15,
    },
    sendButtonText: {
      color: "white",
      fontWeight: "bold",
      fontSize: 14,
    },
    disabledInput: {
      backgroundColor: '#f0f0f0',
      color: '#888',
    },
    disabledButton: {
      backgroundColor: '#ccc',
      opacity: 0.7,
    },
  });


  export default styles;
