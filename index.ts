import { AppRegistry } from 'react-native';
import App from './App';  // 🚀 Eğer App.tsx kullanıyorsanız, bu dosyanın yolu doğru olmalı
import { name as appName } from './app.json';


AppRegistry.registerComponent(appName, () => App);
