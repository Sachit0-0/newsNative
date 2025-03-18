import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Picker } from '@react-native-picker/picker';
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';

// Constants
// These values are public and do not contain any sensitive information.
// They are not private API keys, but rather public API keys that can be used
// by anyone to access the News API.
// See https://newsapi.org/s/about for more information.
const API_KEY = 'cd00e60d5e354c99a1d67fb99609d403';
const BASE_URL = 'https://newsapi.org/v2';
const CATEGORIES = ['all', 'politics', 'tech', 'sports', 'business'];


type Article = {
  url: string;
  title: string;
  description: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  author: string;
};

type NewsResponse = {
  articles: Article[];
  nextPage: number;
};

// Category sources mapping
const CATEGORY_SOURCES: Record<string, string> = {
  politics: 'bbc-news,the-guardian-uk',
  tech: 'techcrunch,wired',
  sports: 'espn,bbc-sport',
  business: 'bloomberg,financial-times',
};

// API Utility
const fetchNews = async ({
  category = 'all',
  searchTerm = '',
  page = 1,
}: {
  category?: string;
  searchTerm?: string;
  page?: number;
}): Promise<NewsResponse> => {
  const params: Record<string, string | number> = {
    apiKey: API_KEY,
    q: searchTerm || 'news',
    page,
    pageSize: 10,
  };

  // Apply category filter if not 'all'
  if (category !== 'all' && CATEGORY_SOURCES[category]) {
    params.sources = CATEGORY_SOURCES[category];
  }

  const response = await axios.get(`${BASE_URL}/everything`, { params });
  return {
    articles: response.data.articles,
    nextPage: page + 1,
  };
};

// News Item Component
const NewsItem = ({ item }: { item: Article }) => (
  <View style={styles.newsItem}>
    <Image
      source={{ uri: item.urlToImage || 'https://placehold.co/600x400' }}
      style={styles.newsImage}
    />
    <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
    <Text style={styles.newsDescription} numberOfLines={3}>
      {item.description || 'No description available'}
    </Text>
    <View style={styles.newsFooter}>
      <Text style={styles.newsAuthor}>{item.source.name || 'Unknown'}</Text>
      <Text style={styles.newsDate}>
        {new Date(item.publishedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </Text>
    </View>
  </View>
);

// Main Component
export default function NewsApp() {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery<NewsResponse>({
    queryKey: ['news', activeCategory, searchTerm],
    queryFn: ({ pageParam = 1 }) =>
      fetchNews({ category: activeCategory, searchTerm, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });

  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  const allNews = data?.pages.flatMap((page) => page.articles) || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>NewsHub</Text>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search for news..."
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Icon name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Dropdown */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={activeCategory}
          onValueChange={(itemValue: React.SetStateAction<string>) => setActiveCategory(itemValue)}
          style={styles.picker}
        >
          {CATEGORIES.map((category) => (
            <Picker.Item
              key={category}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              value={category}
            />
          ))}
        </Picker>
      </View>

      {/* News List */}
      {status === 'pending' ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : status === 'error' ? (
        <Text style={styles.errorText}>Error: {error.message}</Text>
      ) : (
        <FlatList
          data={allNews}
          keyExtractor={(item) => `${item.url}-${item.publishedAt}`}
          renderItem={({ item }) => <NewsItem item={item} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator size="small" color="#007bff" />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
  },
  pickerContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  picker: {
    width: '100%',
  },
  newsItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  newsImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  newsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  newsDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newsAuthor: {
    fontSize: 12,
    color: '#888',
  },
  newsDate: {
    fontSize: 12,
    color: '#888',
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});