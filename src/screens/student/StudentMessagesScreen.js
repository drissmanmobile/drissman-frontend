// src/screens/student/StudentMessagesScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native'
import { useTheme } from '../../context/ThemeContext'
import { Spacing, Radius, Shadows } from '../../utils/theme'
import {
  getChatContacts,
  getChatMessages,
  sendChatMessage,
  markChatRead,
} from '../../services/services'

export default function StudentMessagesScreen() {
  const { Colors: themeColors } = useTheme()
  const styles = getStyles(themeColors)
  const navigation = useNavigation()
  const route = useRoute()

  const { monitorId, monitorName } = route.params || {}

  const [contacts, setContacts] = useState([])
  const [activeContact, setActiveContact] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)

  const flatListRef = useRef(null)

  const fetchContacts = async () => {
    try {
      const data = await getChatContacts()
      if (Array.isArray(data)) {
        setContacts(data)
        if (monitorId) {
          const match = data.find((c) => c.userId === monitorId || c.monitorId === monitorId)
          if (match) setActiveContact(match)
        } else if (monitorName && !activeContact) {
          const match = data.find((c) => c.name === monitorName)
          if (match) setActiveContact(match)
        }
      }
    } catch (e) {
      console.log('Error fetching student chat contacts:', e)
    } finally {
      setLoadingContacts(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchContacts()
      const interval = setInterval(fetchContacts, 5000)
      return () => clearInterval(interval)
    }, [monitorId, monitorName])
  )

  const loadMessages = async (partnerId) => {
    setLoadingMessages(true)
    try {
      const data = await getChatMessages(partnerId)
      if (Array.isArray(data)) {
        setMessages(data)
      }
      await markChatRead(partnerId)
    } catch (e) {
      console.log('Error loading student chat messages:', e)
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    let interval = null
    if (activeContact?.userId) {
      loadMessages(activeContact.userId)
      interval = setInterval(() => {
        getChatMessages(activeContact.userId)
          .then((data) => {
            if (Array.isArray(data)) setMessages(data)
          })
          .catch(() => {})
      }, 3000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeContact])

  const handleSend = async () => {
    if (!inputText.trim() || !activeContact?.userId || sending) return
    const textToSend = inputText.trim()
    setInputText('')
    setSending(true)

    const tempMsg = {
      id: 'temp_' + Date.now(),
      senderId: 'me',
      recipientId: activeContact.userId,
      content: textToSend,
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMsg])

    try {
      const savedMsg = await sendChatMessage(activeContact.userId, textToSend, activeContact.offerId)
      if (savedMsg) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempMsg.id ? { ...savedMsg, isMe: true } : m))
        )
      }
      fetchContacts()
    } catch (e) {
      console.log('Error sending chat message:', e)
    } finally {
      setSending(false)
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {activeContact ? (
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setActiveContact(null)}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {activeContact ? activeContact.name : 'Contacter mon Moniteur'}
          </Text>
          {activeContact?.offerName && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Offre: {activeContact.offerName}
            </Text>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      {!activeContact ? (
        /* Contact / Conversation List */
        loadingContacts ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.userId || item.email || Math.random().toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
                <Text style={styles.emptyText}>Aucun moniteur associé à votre offre pour le moment</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.convCard}
                onPress={() => setActiveContact(item)}
              >
                <View style={styles.avatar}>
                  <Ionicons name="school" size={24} color="#4F46E5" />
                </View>
                <View style={styles.convMain}>
                  <View style={styles.convTopRow}>
                    <Text style={styles.convName}>👨‍🏫 {item.name}</Text>
                    <Text style={styles.convTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.offerBadge} numberOfLines={1}>
                    Offre : {item.offerName || 'Inscrite'}
                  </Text>
                  <Text style={styles.convLastMsg} numberOfLines={1}>
                    {item.lastMsg}
                  </Text>
                </View>
                {item.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        )
      ) : (
        /* Active Chat View */
        <View style={styles.chatView}>
          {loadingMessages ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id || Math.random().toString()}
              contentContainerStyle={styles.messagesList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => (
                <View style={[styles.bubble, item.isMe ? styles.bubbleMe : styles.bubbleOther]}>
                  <Text style={[styles.msgText, item.isMe ? styles.msgTextMe : styles.msgTextOther]}>
                    {item.content}
                  </Text>
                  <Text style={[styles.timeText, item.isMe ? styles.timeTextMe : styles.timeTextOther]}>
                    {item.time}
                  </Text>
                </View>
              )}
            />
          )}

          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Posez une question à votre moniteur..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

const getStyles = (themeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: '#F9FAFB',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
    },
    headerIconBtn: { padding: 4 },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
    headerSubtitle: { fontSize: 12, color: '#4F46E5', fontWeight: '500', marginTop: 2 },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
    emptyText: { marginTop: 12, fontSize: 14, color: '#6B7280', textAlign: 'center' },

    listContent: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    convCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      ...Shadows.sm,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#EEF2FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    convMain: { flex: 1 },
    convTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    convName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    convTime: { fontSize: 12, color: '#9CA3AF' },
    offerBadge: { fontSize: 11, color: '#4F46E5', fontWeight: '600', marginBottom: 4 },
    convLastMsg: { fontSize: 13, color: '#6B7280' },
    unreadBadge: {
      backgroundColor: '#EF4444',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    unreadText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

    chatView: { flex: 1 },
    messagesList: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
    bubble: {
      maxWidth: '80%',
      borderRadius: Radius.md,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    bubbleMe: { backgroundColor: '#4F46E5', alignSelf: 'flex-end' },
    bubbleOther: { backgroundColor: '#FFF', alignSelf: 'flex-start', ...Shadows.sm },
    msgText: { fontSize: 14 },
    msgTextMe: { color: '#FFF' },
    msgTextOther: { color: '#111827' },
    timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    timeTextMe: { color: '#E0E7FF' },
    timeTextOther: { color: '#9CA3AF' },

    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: '#FFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    chatInput: {
      flex: 1,
      backgroundColor: '#F3F4F6',
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      height: 44,
      fontSize: 14,
      color: '#111827',
      marginRight: Spacing.sm,
    },
    sendButton: {
      width: 44,
      height: 44,
      backgroundColor: '#4F46E5',
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendDisabled: { backgroundColor: '#9CA3AF' },
  })
