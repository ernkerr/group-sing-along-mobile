import { requireNativeModule } from 'expo-modules-core';

const ExpoSafariReaderModule = requireNativeModule('ExpoSafariReader');

export async function openReaderView(url: string): Promise<string> {
  return await ExpoSafariReaderModule.openReaderView(url);
}
