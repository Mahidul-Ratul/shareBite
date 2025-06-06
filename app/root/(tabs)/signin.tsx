import { View, Text, SafeAreaView, ScrollView,Image, TouchableOpacity } from 'react-native'
import React from 'react'
import images from '@/constants/images'

const signin = () => {
  return (
    <SafeAreaView className='bg-white h-full'>
      <ScrollView contentContainerClassName='h-full'>
        <Image source={images.del} className="w-full h-4/6" resizeMode='contain' />   
        <View className='px-10'>
          <Text className='text-base text-center uppercase font-rubik text-black-200'>Welcome in Fooddi</Text>
          <Text className='text-3xl text-center font-rubik-bold text-black-300 mt-2'>Interested to Join </Text>
          <Text className='text-lg text-center font-rubik text-black-200 mt-12'>Wants to Login</Text>

          <TouchableOpacity ></TouchableOpacity>
        </View>
       </ScrollView>
    </SafeAreaView>
  )
}

export default signin