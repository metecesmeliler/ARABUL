import * as Location from "expo-location";

export const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("Konum izni reddedildi.");
      return null;
    }

    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error("Konum alma hatası:", error);
    return null;
  }
};
