import React, { useState } from 'react';
import { View, Image, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';
import { Icon, IconName } from './Icon';

/**
 * Admin-managed image slot (cases / projects / consultants / news / events).
 *
 * - `uri` comes from the admin panel (TODO(backend): media upload URLs).
 * - While loading → dimmed placeholder + spinner.
 * - On error, or when no uri is provided yet → privacy-safe branded fallback
 *   (gradient + icon). NEVER a random public photo: beneficiary imagery must
 *   be approved by the association before it reaches the app.
 * - `resizeMode: cover` + fixed container = aspect-ratio safe.
 *   Server-side rule (BACKEND.md §media): resize to max 1280px, ~80% JPEG.
 */
export function RemoteImage({
  uri,
  gradient = [colors.navy300, colors.navy700],
  icon = 'image',
  style,
}: {
  uri?: string;
  gradient?: [string, string];
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const [loading, setLoading] = useState(!!uri);
  const [failed, setFailed] = useState(false);

  const showFallback = !uri || failed;

  return (
    <View style={[{ overflow: 'hidden', backgroundColor: colors.paper2 }, style]}>
      {showFallback ? (
        <LinearGradient colors={gradient} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={22} color="rgba(255,255,255,.75)" />
        </LinearGradient>
      ) : (
        <>
          <Image
            source={{ uri }}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setFailed(true);
              setLoading(false);
            }}
            accessible
            accessibilityRole="image"
          />
          {loading && (
            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper2 }}>
              <ActivityIndicator color={colors.navy500} />
            </View>
          )}
        </>
      )}
    </View>
  );
}
