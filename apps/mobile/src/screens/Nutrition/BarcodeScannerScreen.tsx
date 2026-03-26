import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import api from '../../api/client';

interface Props {
  onFoodFound: (food: unknown) => void;
  onClose: () => void;
}

export default function BarcodeScannerScreen({ onFoodFound, onClose }: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned) return;
    setScanned(true);

    try {
      const response = await api.get(`/nutrition/foods/barcode/${data}`);
      onFoodFound(response.data);
    } catch {
      Alert.alert('Bulunamadı', `"${data}" barkodu veritabanında bulunamadı.`, [
        { text: 'Tekrar Dene', onPress: () => setScanned(false) },
        { text: 'Kapat', onPress: onClose },
      ]);
    }
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Kamera izni isteniyor...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Kamera erişimi reddedildi</Text>
        <TouchableOpacity onPress={onClose} style={styles.button}>
          <Text style={styles.buttonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ['ean8', 'ean13', 'qr'] }}
        onBarcodeScanned={handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.hint}>Barkodu çerçeve içine getirin</Text>
        <TouchableOpacity onPress={onClose} style={styles.button}>
          <Text style={styles.buttonText}>İptal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  text: { color: '#fff', fontSize: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanArea: {
    width: 250, height: 150,
    borderWidth: 2, borderColor: '#f97316', borderRadius: 12,
    marginBottom: 20,
  },
  hint: { color: '#fff', marginBottom: 40, textAlign: 'center' },
  button: {
    backgroundColor: '#f97316', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
