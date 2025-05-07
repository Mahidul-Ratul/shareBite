import React, { useState } from "react";
import { View, Text, Image, TextInput, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// Define the Post type
interface Post {
  id: string;
  user: string;
  content: string;
  likes: number;
  comments: number;
  imageUrl: string;
  commentsList: string[];
}

const initialPosts: Post[] = [
  { id: "1", user: "User 1", content: "Donating food to the needy today!", likes: 5, comments: 2, imageUrl: "@/assets/images/avatar.png", commentsList: [] },
  { id: "2", user: "User 2", content: "Looking for volunteers to distribute food.", likes: 3, comments: 1, imageUrl: "https://example.com/food-image2.jpg", commentsList: [] },
];

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPostContent, setNewPostContent] = useState<string>("");

  // Handle like button click
  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  // Handle comment button click
  const handleComment = (postId: string, commentText: string) => {
    if (!commentText.trim()) return; // Do not add empty comments

    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            comments: post.comments + 1, 
            commentsList: [...post.commentsList, commentText] 
          } 
        : post
    ));
  };

  // Handle post creation
  const handleCreatePost = () => {
    const newPost: Post = {
      id: (posts.length + 1).toString(),
      user: "User 3",  // This would be dynamic based on the logged-in user
      content: newPostContent,
      likes: 0,
      comments: 0,
      imageUrl: "",
      commentsList: [],
    };
    setPosts([newPost, ...posts]);
    setNewPostContent("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community Feed</Text>

      {/* Profile Icon */}
      <TouchableOpacity style={styles.profileIconContainer}>
        <FontAwesome name="user-circle" size={40} color="#FF6600" />
      </TouchableOpacity>

      {/* Create Post Section */}
      <View style={styles.createPostContainer}>
        <TextInput
          style={styles.createPostInput}
          placeholder="What's on your mind?"
          value={newPostContent}
          onChangeText={setNewPostContent}
        />
        <TouchableOpacity
          style={styles.createPostButton}
          onPress={handleCreatePost}
          disabled={!newPostContent.trim()}
        >
          <Text style={styles.createPostText}>Post</Text>
        </TouchableOpacity>
      </View>

      {/* Post List */}
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            <Text style={styles.userName}>{item.user}</Text>
            <Text style={styles.postContent}>{item.content}</Text>
            {item.imageUrl && <Image source={require('@/assets/images/avatar.png')} style={styles.image} />
        }
            
            {/* Post Interactions */}
            <View style={styles.interactionContainer}>
              <TouchableOpacity 
                style={styles.interactionButton}
                onPress={() => handleLike(item.id)}
              >
                <FontAwesome name="thumbs-up" size={20} color="#FF6600" />
                <Text style={styles.interactionText}>Like ({item.likes})</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.interactionButton}
                onPress={() => {}}
              >
                <FontAwesome name="comment" size={20} color="#FF6600" />
                <Text style={styles.interactionText}>Comment ({item.comments})</Text>
              </TouchableOpacity>
            </View>

            {/* Display Comments */}
            {item.commentsList.length > 0 && (
              <View style={styles.commentsContainer}>
                {item.commentsList.map((comment, index) => (
                  <Text key={index} style={styles.commentText}>- {comment}</Text>
                ))}
              </View>
            )}

            {/* Comment Input */}
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              onSubmitEditing={(e) => handleComment(item.id, e.nativeEvent.text)}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", color: "#FF6600", marginBottom: 20 },
  profileIconContainer: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  createPostContainer: { marginBottom: 20 },
  createPostInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  createPostButton: {
    backgroundColor: "#FF6600",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  createPostText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  postContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  userName: { fontSize: 18, fontWeight: "bold", color: "#FF6600" },
  postContent: { marginVertical: 10, fontSize: 16, color: "#333" },
  image: { width: "100%", height: 200, marginVertical: 10, borderRadius: 8 },
  interactionContainer: { flexDirection: "row", justifyContent: "space-between" },
  interactionButton: { flexDirection: "row", alignItems: "center" },
  interactionText: { marginLeft: 5, color: "#FF6600" },
  commentsContainer: { marginTop: 10, paddingLeft: 10 },
  commentText: { fontSize: 14, color: "#555" },
  commentInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    fontSize: 16,
  },
});
