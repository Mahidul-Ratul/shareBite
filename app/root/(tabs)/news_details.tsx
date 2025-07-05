import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../constants/supabaseConfig';
import { MaterialIcons } from '@expo/vector-icons';

const NewsDetails = () => {
  const params = useLocalSearchParams();
  const news_id = params.news_id || params.id; // Fallback for both parameter names
  const from = params.from;
  const [news, setNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('Checking connection...');
  const router = useRouter();

  // Performance optimizations:
  // 1. Memoized fetch function to prevent unnecessary re-renders
  // 2. Request timeout to prevent hanging requests
  // 3. Selective database query (only needed fields)
  // 4. Image caching with force-cache
  // 5. Optimized image source handling
  // 6. Error boundaries and retry functionality
  // 7. Loading states for better UX

  // Debug: Log all received parameters
  console.log('News Details - Received params:', params);
  console.log('News Details - Using news_id:', news_id);
  console.log('News Details - From:', from);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchNews = useCallback(async () => {
    console.log('Fetching news with ID:', news_id); // Debug log
    if (!news_id) {
      console.error('No news_id provided in params:', { news_id, from }); // Debug log
      setError('No news ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Check network connectivity first
      setLoadingStep('Checking internet connection...');
      try {
        const networkPromise = fetch('https://www.google.com', { method: 'HEAD' });
        const networkTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 3000)
        );
        const response = await Promise.race([networkPromise, networkTimeout]) as Response;
        if (!response.ok) {
          throw new Error('Network connectivity issue');
        }
      } catch (networkError) {
        setError('No internet connection. Please check your network and try again.');
        setLoading(false);
        return;
      }
      
      // Add timeout to prevent hanging requests (increased to 15 seconds)
      setLoadingStep('Loading news details...');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );
      
      const fetchPromise = supabase
        .from('news')
        .select('id, title, news, tag, created_at, picture, Location')
        .eq('id', news_id)
        .single();

      const { data, error: supabaseError } = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      if (supabaseError) {
        throw new Error(supabaseError.message);
      }
      
      if (!data) {
        throw new Error('News not found');
      }
      
      setNews(data);
    } catch (err) {
      console.error('Error fetching news:', err);
      let errorMessage = 'Failed to load news';
      
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your internet connection and try again.';
        } else if (err.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Connection failed. Please check your internet and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [news_id]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Optimized image source handling with caching
  const getImageSource = useCallback((picture: string) => {
    if (!picture) return null;
    
    try {
      // Check if it's already a data URL
      if (picture.startsWith('data:')) {
        return { uri: picture, cache: 'force-cache' as const };
      }
      
      // Check if it's a valid base64 string
      if (/^[A-Za-z0-9+/=]+$/.test(picture) && picture.length > 100) {
        return { uri: `data:image/jpeg;base64,${picture}`, cache: 'force-cache' as const };
      }
      
      // Assume it's a regular URL with caching
      return { uri: picture, cache: 'force-cache' as const };
    } catch (err) {
      console.error('Error processing image:', err);
      return null;
    }
  }, []);

  // Handle back navigation
  const handleBackPress = useCallback(() => {
    if (from === 'volunteer') {
      router.replace('/root/(tabs)/volunteer/All_News');
    } else if (from === 'receiver') {
      router.replace('/root/(tabs)/receiver/All_News');
    } else if (from === 'donor') {
      router.replace('/root/(tabs)/donor/All_News');
    } else {
      router.back();
    }
  }, [from, router]);

  // Retry function
  const handleRetry = useCallback(() => {
    setError(null);
    fetchNews();
  }, [fetchNews]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          {/* Animated Ring */}
          <View style={{ position: 'relative' }}>
            {/* Outer Ring */}
            <View style={{ 
              width: 80, 
              height: 80, 
              borderWidth: 4, 
              borderColor: '#bbf7d0', 
              borderRadius: 40, 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              {/* Inner Ring */}
              <View style={{ 
                width: 48, 
                height: 48, 
                borderWidth: 4, 
                borderColor: '#4ade80', 
                borderRadius: 24,
                opacity: 0.7
              }}>
                {/* Center Circle */}
                <View style={{ 
                  width: 24, 
                  height: 24, 
                  backgroundColor: '#16a34a', 
                  borderRadius: 12,
                  position: 'absolute',
                  top: 8,
                  left: 8
                }} />
              </View>
            </View>
            {/* Rotating Ring */}
            <View style={{ 
              position: 'absolute', 
              inset: 0, 
              width: 80, 
              height: 80, 
              borderWidth: 4, 
              borderColor: 'transparent', 
              borderTopColor: '#16a34a', 
              borderRadius: 40,
              transform: [{ rotate: '0deg' }]
            }} />
          </View>
          
          {/* Loading Text */}
          <Text style={{ color: '#374151', fontSize: 18, fontWeight: '600', marginTop: 24 }}>Loading news...</Text>
          <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 8 }}>{loadingStep}</Text>
          
          {/* Loading Dots */}
          <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
            <View style={{ 
              width: 8, 
              height: 8, 
              backgroundColor: '#4ade80', 
              borderRadius: 4,
              opacity: 0.7
            }} />
            <View style={{ 
              width: 8, 
              height: 8, 
              backgroundColor: '#4ade80', 
              borderRadius: 4,
              opacity: 0.7
            }} />
            <View style={{ 
              width: 8, 
              height: 8, 
              backgroundColor: '#4ade80', 
              borderRadius: 4,
              opacity: 0.7
            }} />
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center' }}>
          {/* Error Icon */}
          <View style={{ 
            width: 64, 
            height: 64, 
            backgroundColor: '#fef2f2', 
            borderRadius: 32, 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: 16 
          }}>
            <MaterialIcons name="error-outline" size={32} color="#ef4444" />
          </View>
          <Text style={{ color: '#1f2937', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Failed to load news</Text>
          <Text style={{ color: '#6b7280', textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
            {error}
          </Text>
          <TouchableOpacity 
            style={{ backgroundColor: '#16a34a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            onPress={handleRetry}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!news) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <MaterialIcons name="article" size={48} color="#d1d5db" />
          <Text style={{ color: '#6b7280', fontSize: 16, fontWeight: '600', marginTop: 12 }}>News not found</Text>
        </View>
      </View>
    );
  }

  const imageSource = getImageSource(news.picture);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#f1f5f9' }}>
        <TouchableOpacity 
          onPress={handleBackPress}
          style={{ marginRight: 12, padding: 8, backgroundColor: '#f3f4f6', borderRadius: 20 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#22223b' }}>News Details</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 0, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* News Image with Loading State */}
        <View style={{ position: 'relative' }}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={{ width: '100%', height: 240, backgroundColor: '#f1f5f9' }}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                console.warn('Failed to load image');
              }}
              fadeDuration={300}
            />
          ) : (
            <View style={{ width: '100%', height: 240, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }}>
              <MaterialIcons name="image" size={48} color="#9ca3af" />
            </View>
          )}
          
          {/* Image Loading Overlay */}
          {imageLoading && (
            <View style={{ 
              position: 'absolute', 
              inset: 0, 
              backgroundColor: '#f1f5f9', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}>
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={{ backgroundColor: '#fff', padding: 18 }}>
          {/* Tag and Date */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={[styles.tag, news.tag === 'Featured' ? styles.tagBlue : news.tag === 'Holiday Special' ? styles.tagOrange : styles.tagGreen]}> 
              <Text style={[styles.tagText, news.tag === 'Featured' ? styles.textBlue : news.tag === 'Holiday Special' ? styles.textOrange : styles.textGreen]}>
                {news.tag || 'Latest Update'}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {news.created_at ? new Date(news.created_at).toLocaleDateString() : ''}
            </Text>
          </View>

          {/* Title */}
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#22223b', marginBottom: 12, lineHeight: 34 }}>
            {news.title}
          </Text>

          {/* Location */}
          {news.Location && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <MaterialIcons name="location-on" size={18} color="#6B7280" />
              <Text style={{ color: '#6b7280', fontSize: 15, marginLeft: 4 }}>{news.Location}</Text>
            </View>
          )}

          {/* Divider */}
          <View style={{ borderTopWidth: 1, borderColor: '#e5e7eb', marginVertical: 16 }} />

          {/* News Content */}
          <Text style={{ color: '#374151', fontSize: 17, lineHeight: 28, textAlign: 'justify' }}>
            {news.news}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagBlue: { backgroundColor: '#dbeafe' },
  tagGreen: { backgroundColor: '#bbf7d0' },
  tagOrange: { backgroundColor: '#fed7aa' },
  tagText: { fontWeight: 'bold', fontSize: 13 },
  textBlue: { color: '#2563eb' },
  textGreen: { color: '#16a34a' },
  textOrange: { color: '#ea580c' },
  dateText: { color: '#6b7280', fontSize: 12 },
});

export default NewsDetails;
