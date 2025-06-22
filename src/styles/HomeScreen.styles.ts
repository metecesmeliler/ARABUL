import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 0, // SafeArea'nın üst padding'ini sıfırla
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0, // Container'ın üst padding'ini sıfırla
    backgroundColor: '#F5F5F5',
  },
  profileButton: {
    marginLeft: 16,
    padding: 6,
  },
  profileButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  userWelcome: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFA000',
    textAlign: 'center',
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  chatButton: {
    backgroundColor: '#FFA000',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  locationButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  locationInfoContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    alignItems: "center",
  },
  locationInfoText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
});

export default styles;
