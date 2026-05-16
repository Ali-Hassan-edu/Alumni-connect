

// src/app/messages/page.tsx
import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Search, Send, MessageSquare, Loader2, ArrowLeft } from 'lucide-react'
import { DashboardLayout, Avatar } from '@/components/layout/DashboardLayout'
import { messageQueries, userQueries } from '@/lib/supabase/queries'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/authStore'
import type { Conversation, DirectMessage, User } from '@/lib/types'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

function MessageBubble({ message, isMe }: { message: DirectMessage & { sender?: User }; isMe: boolean }) {
  const time = format(new Date(message.created_at), 'h:mm a')
  return (
    <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMe && message.sender && (
        <Avatar name={message.sender.full_name} imageUrl={message.sender.profile_picture_url} size="sm" />
      )}
      <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMe
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-card border border-border text-gray-900 dark:text-white rounded-bl-sm'
        }`}>
          {message.content}
        </div>
        <span className="text-xs text-muted-foreground px-1">{time}</span>
      </div>
    </div>
  )
}

function formatConversationDate(dateStr: string) {
  const date = new Date(dateStr)
  if (isToday(date)) return formatDistanceToNow(date, { addSuffix: true })
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

export default function MessagesPage() {
  const { dbUser } = useAuthStore()
  const [conversations, setConversations] = useState<(Conversation & { other_user?: User })[]>([])
  const [activeConv, setActiveConv] = useState<(Conversation & { other_user?: User }) | null>(null)
  const [messages, setMessages] = useState<(DirectMessage & { sender?: User })[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoadingConvs, setIsLoadingConvs] = useState(true)
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (dbUser?.id) loadConversations()
  }, [dbUser?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Load all registered users when showSearch opens and no search text
    const loadAllUsers = async () => {
      if (showSearch && !search && dbUser?.id) {
        setIsLoadingUsers(true)
        try {
          const allUsers = await userQueries.getAllRegisteredUsers(dbUser.id)
          setSearchResults(allUsers)
        } catch (error) {
          console.error('Failed to load registered users:', error)
        } finally {
          setIsLoadingUsers(false)
        }
      }
    }
    loadAllUsers()
  }, [showSearch, search, dbUser?.id])

  const loadConversations = async () => {
    if (!dbUser?.id) return
    setIsLoadingConvs(true)
    const convs = await messageQueries.getConversations(dbUser.id)
    // Enrich with other user data
    const enriched = await Promise.all(convs.map(async conv => {
      const otherId = conv.participant_1 === dbUser.id ? conv.participant_2 : conv.participant_1
      const otherUser = await userQueries.getById(otherId)
      return { ...conv, other_user: otherUser || undefined }
    }))
    setConversations(enriched)
    setIsLoadingConvs(false)
  }

  const openConversation = async (conv: Conversation & { other_user?: User }) => {
    setActiveConv(conv)
    setIsLoadingMsgs(true)
    const msgs = await messageQueries.getMessages(conv.id)
    setMessages(msgs as (DirectMessage & { sender?: User })[])
    setIsLoadingMsgs(false)

    // Subscribe to real-time messages
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    channelRef.current = supabase
      .channel(`messages:${conv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages', filter: `conversation_id=eq.${conv.id}` }, async payload => {
        const newMsg = payload.new as DirectMessage
        if (newMsg.sender_id !== dbUser?.id) {
          const sender = await userQueries.getById(newMsg.sender_id)
          setMessages(prev => [...prev, { ...newMsg, sender: sender || undefined }])
        }
      })
      .subscribe()
  }

  const handleSend = async () => {
    if (!activeConv || !dbUser?.id || !newMessage.trim()) return
    setIsSending(true)
    const optimistic: DirectMessage & { sender?: User } = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConv.id,
      sender_id: dbUser.id,
      content: newMessage.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
      sender: dbUser as unknown as User,
    }
    setMessages(prev => [...prev, optimistic])
    setNewMessage('')
    try {
      const sent = await messageQueries.sendMessage(activeConv.id, dbUser.id, optimistic.content)
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...sent, sender: dbUser as unknown as User } : m))
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    } finally {
      setIsSending(false)
    }
  }

  const handleSearchUsers = async (q: string) => {
    setSearch(q)
    if (!q.trim()) { 
      if (showSearch && dbUser?.id) {
        // Load all users when search is cleared
        setIsLoadingUsers(true)
        try {
          const allUsers = await userQueries.getAllRegisteredUsers(dbUser.id)
          setSearchResults(allUsers)
        } catch (error) {
          console.error('Failed to load registered users:', error)
        } finally {
          setIsLoadingUsers(false)
        }
      } else {
        setSearchResults([])
      }
      return 
    }
    // Search for specific users
    const result = await userQueries.getAllUsers({ search: q, status: 'approved', limit: 8 })
    setSearchResults(result.data.filter(u => u.id !== dbUser?.id))
  }

  const startConversation = async (user: User) => {
    if (!dbUser?.id) return
    const conv = await messageQueries.getOrCreateConversation(dbUser.id, user.id)
    const enriched = { ...conv, other_user: user }
    setConversations(prev => {
      const exists = prev.find(c => c.id === conv.id)
      return exists ? prev : [enriched, ...prev]
    })
    openConversation(enriched)
    setShowSearch(false)
    setSearch('')
    setSearchResults([])
  }

  const filteredConvs = conversations.filter(c =>
    !search || c.other_user?.full_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-0px)] lg:h-[calc(100vh-0px)]">
        {/* Sidebar */}
        <div className={`${activeConv ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-72 border-r border-border bg-card`}>
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 dark:text-white">Messages</h2>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                title="New conversation"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => handleSearchUsers(e.target.value)}
                onFocus={() => setShowSearch(true)}
                placeholder={showSearch ? "Search users to message..." : "Search conversations..."}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Search results */}
            {showSearch && (
              <div className="mt-2">
                {isLoadingUsers ? (
                  <div className="border border-border rounded-xl overflow-hidden shadow-lg">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-3 border-b border-border last:border-b-0">
                        <div className="skeleton w-10 h-10 rounded-full" />
                        <div className="flex-1">
                          <div className="skeleton h-4 w-32 mb-2 rounded" />
                          <div className="skeleton h-3 w-20 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="border border-border rounded-xl overflow-hidden shadow-lg">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => startConversation(user)}
                        className="flex items-center gap-2.5 w-full p-3 hover:bg-accent transition-colors text-left border-b border-border last:border-b-0"
                      >
                        <Avatar name={user.full_name} imageUrl={user.profile_picture_url} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : search ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No users found matching "{search}"
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoadingConvs ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground opacity-40 mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet. Search for a member to start chatting!</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredConvs.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all text-left ${
                      activeConv?.id === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-accent'
                    }`}
                  >
                    {conv.other_user && <Avatar name={conv.other_user.full_name} imageUrl={conv.other_user.profile_picture_url} size="md" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{conv.other_user?.full_name || 'Unknown'}</span>
                        {conv.last_message_at && <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatConversationDate(conv.last_message_at)}</span>}
                      </div>
                      {conv.last_message && <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${!activeConv ? 'hidden lg:flex' : 'flex'} flex-1 flex-col`}>
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground opacity-40 mb-3" />
                <p className="text-muted-foreground">Select a conversation or search for a member to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
                <button onClick={() => setActiveConv(null)} className="lg:hidden p-2 rounded-lg hover:bg-accent">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                {activeConv.other_user && (
                  <>
                    <Avatar name={activeConv.other_user.full_name} imageUrl={activeConv.other_user.profile_picture_url} />
                    <div>
                      <Link to={`/profile/${activeConv.other_user.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 text-sm">
                        {activeConv.other_user.full_name}
                      </Link>
                      <p className="text-xs text-muted-foreground capitalize">{activeConv.other_user.role}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {isLoadingMsgs ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">No messages yet. Say hello! 👋</p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} isMe={msg.sender_id === dbUser?.id} />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center gap-3">
                  <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder={`Message ${activeConv.other_user?.full_name?.split(' ')[0] || ''}...`}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isSending || !newMessage.trim()}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-colors"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
