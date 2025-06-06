import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

import { supabase } from "../../../../constants/supabaseConfig";


export default function AddNews() {
    const [title, setTitle] = useState("");
    const [news, setNews] = useState("");
    const [tag, setTag] = useState("");
    const [Location, setLocation]=useState("");
    const [picture, setPicture] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets.length > 0) {
            setPicture(result.assets[0]);
        }
    };

    const uploadImage = async (imageUri: string) => {
        const fileExt = imageUri.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
        // Store base64 string directly in the database
        return `data:image/${fileExt};base64,${base64}`;
    };

    const handleSubmit = async () => {
        setLoading(true);
        setMessage("");
        let pictureUrl = null;
        try {
            if (picture) {
                pictureUrl = await uploadImage(picture.uri);
                if (!pictureUrl) {
                    setMessage("Failed to process image");
                    setLoading(false);
                    return;
                }
            }
            const { error } = await supabase.from("news").insert([
                { title, news, tag,Location, picture: pictureUrl },
            ]);
            if (error) {
                console.log("Insert error:", error);
                setMessage("Error posting news");
            } else {
                setMessage("News posted successfully!");
                setTitle("");
                setNews("");
                setTag("");
                setLocation("");
                setPicture(null);
            }
        } catch (err) {
            console.log("Unexpected error:", err);
            setMessage("Unexpected error occurred");
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Post News</Text>
                <Text style={styles.subtitle}>Share the latest updates with your community</Text>

                <Text style={styles.label}>Title</Text>
                <TextInput
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                    placeholder="Enter news title"
                    placeholderTextColor="#aaa"
                />

                <Text style={styles.label}>News Text</Text>
                <TextInput
                    value={news}
                    onChangeText={setNews}
                    style={[styles.input, { height: 80 }]}
                    placeholder="Write your news here..."
                    placeholderTextColor="#aaa"
                    multiline
                />

                <Text style={styles.label}>Tag</Text>
                <TextInput
                    value={tag}
                    onChangeText={setTag}
                    style={styles.input}
                    placeholder="e.g. Announcement, Event"
                    placeholderTextColor="#aaa"
                />
                <Text style={styles.label}>Location</Text>
                <TextInput
                    value={Location}
                    onChangeText={setLocation}
                    style={styles.input}
                    placeholder="Location"
                    placeholderTextColor="#aaa"
                />

                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                    <Text style={styles.imageButtonText}>{picture ? "Image Selected" : "Pick an Image"}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, loading && { opacity: 0.6 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post News</Text>}
                </TouchableOpacity>

                {!!message && (
                    <Text style={[styles.message, message.includes("success") ? styles.success : styles.error]}>
                        {message}
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f3e8ff",
        paddingVertical: 20,
    },
    card: {
        width: "90%",
        maxWidth: 400,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 6,
        borderWidth: 1,
        borderColor: "#ede9fe",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#7c3aed",
        textAlign: "center",
        marginBottom: 4,
    },
    subtitle: {
        textAlign: "center",
        color: "#6b7280",
        marginBottom: 16,
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
        color: "#4b5563",
        marginBottom: 4,
        marginTop: 10,
    },
    input: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === "ios" ? 12 : 8,
        fontSize: 16,
        backgroundColor: "#fafafa",
        marginBottom: 4,
    },
    imageButton: {
        backgroundColor: "#ede9fe",
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: "center",
        marginVertical: 10,
    },
    imageButtonText: {
        color: "#7c3aed",
        fontWeight: "bold",
    },
    button: {
        backgroundColor: "#7c3aed",
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    message: {
        textAlign: "center",
        marginTop: 12,
        fontWeight: "600",
    },
    success: {
        color: "#059669",
    },
    error: {
        color: "#dc2626",
    },
});
