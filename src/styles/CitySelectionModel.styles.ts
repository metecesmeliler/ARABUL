import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "85%",
    maxHeight: "70%",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  cityItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    minHeight: 50,
    justifyContent: "center",
  },
  selectedCity: {
    backgroundColor: "#ffad00",
  },
  cityText: {
    fontSize: 16,
    color: "#333",
  },
  selectedText: {
    color: "white",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 10,
  },
  cancelButton: {
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: "#ffad00",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
});

export default styles;
