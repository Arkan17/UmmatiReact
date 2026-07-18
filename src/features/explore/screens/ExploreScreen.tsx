import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Heart, Calendar, MessageCircle, Users, MoreVertical, Plus, MessageSquare, User, Bookmark, X } from 'lucide-react-native';
import { useScreenTime } from '../../../core/hooks/useScreenTime';
import { useAuth } from '../../../core/hooks/useAuth';
import { supabase } from '../../../core/config/SupabaseClient';
import Svg, { Path } from 'react-native-svg';

// Custom Lantern SVG Icon
function LanternIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v2M12 20v2M8 4h8v2H8V4ZM6 8h12v12H6V8Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M8 8c0-2.5 1.5-4 4-4s4 1.5 4 4v12c0 1.5-1.5 2-4 2s-4-.5-4-2V8Z" stroke={color} strokeWidth={1.5} />
      <Path d="M10 11h4M10 14h4" stroke={color} strokeWidth={1.2} />
    </Svg>
  );
}

const isValidUuid = (id: any): boolean => {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const DEFAULT_MOCK_POSTS = [
  {
    id: 'mock-1',
    author: 'Fatima Khan',
    avatarColor: '#E6F4EA',
    avatarText: 'FK',
    textColor: '#0E9F6E',
    time: '2h ago',
    content: "What's your favorite verse from Surah Al-Kahf and why?",
    category: 'discuss',
    likes: 12,
    comments: 2,
    isLiked: false,
    isBookmarked: false,
  },
  {
    id: 'mock-2',
    author: 'Ahmed Raza',
    avatarColor: '#FEF3C7',
    avatarText: 'AR',
    textColor: '#D97706',
    time: '5h ago',
    content: "Jumu'ah Reminder: Don't forget to send blessings upon the Prophet ﷺ",
    category: 'discuss',
    likes: 18,
    comments: 2,
    isLiked: false,
    isBookmarked: false,
  }
];

const formatTimeAgo = (dateStr: string) => {
  try {
    const created = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '2h ago';
  }
};

export function ExploreScreen() {
  useScreenTime('Explore');
  const { user } = useAuth();

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'discuss' | 'ask' | 'event' | 'group'>('discuss');

  // Active Category Filter state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'discuss' | 'ask' | 'event' | 'group' | null>(null);

  // Comments modal state
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<any | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        let userLikes: string[] = [];
        let userBookmarks: string[] = [];
        if (user?.id && isValidUuid(user.id)) {
          const { data: likesData } = await supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', user.id);
          if (likesData) userLikes = likesData.map(l => l.post_id);

          const { data: bookmarksData } = await supabase
            .from('bookmarks')
            .select('post_id')
            .eq('user_id', user.id);
          if (bookmarksData) userBookmarks = bookmarksData.map(b => b.post_id);
        }

        const processedPosts = await Promise.all(data.map(async (p) => {
          const { count: likesCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', p.id);

          const { count: commentsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', p.id);

          return {
            id: p.id,
            author: p.author_name,
            avatarColor: p.avatar_color,
            avatarText: p.avatar_text,
            textColor: p.text_color,
            time: formatTimeAgo(p.created_at),
            content: p.content,
            category: p.category,
            likes: likesCount || 0,
            comments: commentsCount || 0,
            isLiked: userLikes.includes(p.id),
            isBookmarked: userBookmarks.includes(p.id),
          };
        }));
        setPosts(processedPosts);
      } else {
        setPosts(DEFAULT_MOCK_POSTS);
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to mock data:', e);
      setPosts(DEFAULT_MOCK_POSTS);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const toggleLike = async (postId: string) => {
    // 1. Optimistic update
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const isLiked = !post.isLiked;
          return {
            ...post,
            isLiked,
            likes: isLiked ? post.likes + 1 : post.likes - 1
          };
        }
        return post;
      })
    );

    if (postId.startsWith('mock-') || postId.startsWith('local-')) return;
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (!post.isLiked) {
        await supabase.from('likes').insert({
          post_id: postId,
          user_id: user?.id && isValidUuid(user.id) ? user.id : null
        });
      } else {
        await supabase.from('likes').delete().match({
          post_id: postId,
          user_id: user?.id && isValidUuid(user.id) ? user.id : null
        });
      }
    } catch (e) {
      console.warn('Failed to sync like toggle:', e);
    }
  };

  const toggleBookmark = async (postId: string) => {
    // 1. Optimistic update
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const isBookmarked = !post.isBookmarked;
          if (isBookmarked) {
            Alert.alert('Bookmark Added', 'This post has been saved to your bookmarks.');
          }
          return {
            ...post,
            isBookmarked
          };
        }
        return post;
      })
    );

    if (postId.startsWith('mock-') || postId.startsWith('local-')) return;
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (!post.isBookmarked) {
        await supabase.from('bookmarks').insert({
          post_id: postId,
          user_id: user?.id && isValidUuid(user.id) ? user.id : null
        });
      } else {
        await supabase.from('bookmarks').delete().match({
          post_id: postId,
          user_id: user?.id && isValidUuid(user.id) ? user.id : null
        });
      }
    } catch (e) {
      console.warn('Failed to sync bookmark toggle:', e);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim()) {
      Alert.alert('Empty Post', 'Please write something before sharing.');
      return;
    }

    const authorName = user?.username || 'Guest User';
    const avatarText = authorName.slice(0, 2).toUpperCase();
    const avatarColor = '#D1FAE5';
    const textColor = '#065F46';

    const localNewPost = {
      id: `local-${Date.now()}`,
      author: authorName,
      avatarColor,
      avatarText,
      textColor,
      time: 'Just now',
      content: newPostText,
      category: newPostCategory,
      likes: 0,
      comments: 0,
      isLiked: false,
      isBookmarked: false,
    };

    setPosts([localNewPost, ...posts]);
    setNewPostText('');
    setShowAddPostModal(false);

    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user?.id && isValidUuid(user.id) ? user.id : null,
        author_name: authorName,
        avatar_text: avatarText,
        avatar_color: avatarColor,
        text_color: textColor,
        content: newPostText,
        category: newPostCategory
      });

      if (error) throw error;
      loadPosts();
      Alert.alert('Post Shared', 'Your reminder has been posted to the community feed!');
    } catch (e: any) {
      console.warn('Failed to insert post in Supabase:', e);
      Alert.alert('Offline Mode', `Your post is visible locally, but could not be saved online.\n\nDetails: ${e?.message || JSON.stringify(e)}`);
    }
  };

  const openComments = async (post: any) => {
    setSelectedPostForComments(post);
    setNewCommentText('');
    setLoadingComments(true);
    setShowCommentsModal(true);

    try {
      if (post.id.startsWith('mock-') || post.id.startsWith('local-')) {
        setPostComments([
          { id: 'c-1', author_name: 'Sch. Zain', content: 'SubhanAllah, very beautiful verse!' },
          { id: 'c-2', author_name: 'Omar Farooq', content: 'Indeed, learning the Quran is the greatest honor.' }
        ]);
        setLoadingComments(false);
        return;
      }

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPostComments(data || []);
    } catch (e) {
      console.warn('Failed to load comments from Supabase:', e);
      setPostComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendComment = async () => {
    if (!newCommentText.trim() || !selectedPostForComments) return;

    const authorName = user?.username || 'Guest User';
    const localComment = {
      id: `local-c-${Date.now()}`,
      author_name: authorName,
      content: newCommentText,
    };

    setPostComments([...postComments, localComment]);
    const inputMsg = newCommentText;
    setNewCommentText('');

    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === selectedPostForComments.id) {
          return {
            ...p,
            comments: p.comments + 1
          };
        }
        return p;
      })
    );

    if (selectedPostForComments.id.startsWith('mock-') || selectedPostForComments.id.startsWith('local-')) return;

    try {
      const { error } = await supabase.from('comments').insert({
        post_id: selectedPostForComments.id,
        user_id: user?.id && isValidUuid(user.id) ? user.id : null,
        author_name: authorName,
        content: inputMsg
      });

      if (error) throw error;
    } catch (e) {
      console.warn('Failed to post comment to Supabase:', e);
    }
  };

  // Filter display list on active category circle filter
  const displayedPosts = posts.filter(post => {
    if (activeCategoryFilter !== null) {
      return post.category === activeCategoryFilter;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Community</Text>
          {activeCategoryFilter && (
            <TouchableOpacity 
              style={styles.resetFilterBtn}
              onPress={() => setActiveCategoryFilter(null)}
            >
              <Text style={styles.resetFilterText}>✕ Reset Filter</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>
          {activeCategoryFilter 
            ? `Viewing Category: ${activeCategoryFilter.toUpperCase()}` 
            : 'Connect. Share. Grow.'}
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Reminder Card */}
        <View style={styles.dailyReminderCard}>
          <View style={styles.dailyReminderLeft}>
            <Text style={styles.dailyReminderLabel}>Daily Reminder</Text>
            <Text style={styles.dailyReminderQuote}>
              "The best among you are those who learn the Quran and teach it."
            </Text>
            <Text style={styles.dailyReminderAuthor}>– Sahih Bukhari</Text>
          </View>
          <View style={styles.lanternContainer}>
            <LanternIcon color="#F59E0B" size={48} />
          </View>
        </View>

        {/* Category Circle Actions Row */}
        <View style={styles.categoriesRow}>
          <TouchableOpacity 
            style={styles.categoryItem} 
            activeOpacity={0.7} 
            onPress={() => setActiveCategoryFilter('discuss')}
          >
            <View style={[
              styles.categoryIconCircle, 
              { backgroundColor: '#E6F4EA' },
              activeCategoryFilter === 'discuss' && styles.categoryIconCircleActive
            ]}>
              <MessageCircle color="#0E9F6E" size={24} />
            </View>
            <Text style={[styles.categoryLabel, activeCategoryFilter === 'discuss' && styles.categoryLabelActive]}>Discuss</Text>
            <Text style={styles.categoryDesc}>Islamic Topics</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.categoryItem} 
            activeOpacity={0.7} 
            onPress={() => setActiveCategoryFilter('ask')}
          >
            <View style={[
              styles.categoryIconCircle, 
              { backgroundColor: '#FFFBEB' },
              activeCategoryFilter === 'ask' && styles.categoryIconCircleActive
            ]}>
              <User color="#F59E0B" size={24} />
            </View>
            <Text style={[styles.categoryLabel, activeCategoryFilter === 'ask' && styles.categoryLabelActive]}>Ask</Text>
            <Text style={styles.categoryDesc}>Scholars</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.categoryItem} 
            activeOpacity={0.7} 
            onPress={() => setActiveCategoryFilter('event')}
          >
            <View style={[
              styles.categoryIconCircle, 
              { backgroundColor: '#EFF6FF' },
              activeCategoryFilter === 'event' && styles.categoryIconCircleActive
            ]}>
              <Calendar color="#3B82F6" size={24} />
            </View>
            <Text style={[styles.categoryLabel, activeCategoryFilter === 'event' && styles.categoryLabelActive]}>Events</Text>
            <Text style={styles.categoryDesc}>Near You</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.categoryItem} 
            activeOpacity={0.7} 
            onPress={() => setActiveCategoryFilter('group')}
          >
            <View style={[
              styles.categoryIconCircle, 
              { backgroundColor: '#ECFDF5' },
              activeCategoryFilter === 'group' && styles.categoryIconCircleActive
            ]}>
              <Users color="#10B981" size={24} />
            </View>
            <Text style={[styles.categoryLabel, activeCategoryFilter === 'group' && styles.categoryLabelActive]}>Groups</Text>
            <Text style={styles.categoryDesc}>Join Communities</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Posts Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {activeCategoryFilter ? `${activeCategoryFilter.charAt(0).toUpperCase() + activeCategoryFilter.slice(1)} Feed` : 'Recent Posts'}
          </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={loadPosts}>
            <Text style={styles.viewAllText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0E9F6E" />
            <Text style={styles.loaderText}>Syncing feed from database...</Text>
          </View>
        ) : (
          <View style={styles.postsContainer}>
            {displayedPosts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postUserLeft}>
                    <View style={[styles.userAvatarCircle, { backgroundColor: post.avatarColor }]}>
                      <Text style={[styles.avatarInitialsText, post.textColor ? { color: post.textColor } : null]}>
                        {post.avatarText}
                      </Text>
                    </View>
                    <View style={styles.postUserMeta}>
                      <Text style={styles.postUserName}>{post.author}</Text>
                      <Text style={styles.postTimeText}>{post.time} • <Text style={styles.postCategoryBadge}>{post.category}</Text></Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.moreButton} 
                    activeOpacity={0.7}
                    onPress={() => Alert.alert('Options', 'Post reporting and sharing features...')}
                  >
                    <MoreVertical color="#94A3B8" size={20} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.postContentText}>{post.content}</Text>
                <View style={styles.postFooterRow}>
                  <View style={styles.postFooterLeft}>
                    <TouchableOpacity 
                      style={styles.postActionItem} 
                      activeOpacity={0.7}
                      onPress={() => toggleLike(post.id)}
                    >
                      <Heart 
                        color={post.isLiked ? '#EF4444' : '#64748B'} 
                        fill={post.isLiked ? '#EF4444' : 'none'} 
                        size={18} 
                      />
                      <Text style={[styles.postActionCountText, post.isLiked && { color: '#EF4444', fontWeight: 'bold' }]}>
                        {post.likes}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.postActionItem} 
                      activeOpacity={0.7}
                      onPress={() => openComments(post)}
                    >
                      <MessageSquare color="#64748B" size={18} />
                      <Text style={styles.postActionCountText}>{post.comments}</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => toggleBookmark(post.id)}>
                    <Bookmark 
                      color={post.isBookmarked ? '#F59E0B' : '#64748B'} 
                      fill={post.isBookmarked ? '#F59E0B' : 'none'} 
                      size={18} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {displayedPosts.length === 0 && (
              <View style={styles.emptyContainer}>
                <MessageCircle color="#94A3B8" size={48} />
                <Text style={styles.emptyText}>No posts in this category yet. Be the first to share one!</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Floating Share a Reminder input box at the bottom (bottom: 90 to prevent tab overlap) */}
      <TouchableOpacity 
        style={styles.shareReminderContainer} 
        activeOpacity={0.9} 
        onPress={() => setShowAddPostModal(true)}
      >
        <View style={styles.shareReminderLeft}>
          <Text style={styles.shareReminderTitle}>Share a Reminder</Text>
          <Text style={styles.shareReminderDesc}>Inspire others with a post</Text>
        </View>
        <View style={styles.floatingAddButton}>
          <Plus color="#FFFFFF" size={22} />
        </View>
      </TouchableOpacity>

      {/* Add Post Dialog Modal */}
      <Modal
        visible={showAddPostModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddPostModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Post</Text>
            
            {/* Category Select Tab Row */}
            <View style={styles.categoryPickerRow}>
              {(['discuss', 'ask', 'event', 'group'] as const).map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pickerChip, newPostCategory === cat && styles.pickerChipActive]}
                  onPress={() => setNewPostCategory(cat)}
                >
                  <Text style={[styles.pickerChipText, newPostCategory === cat && styles.pickerChipTextActive]}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.postInput}
              multiline
              numberOfLines={4}
              placeholder="What's on your mind? Share an Islamic reminder or question with the community..."
              placeholderTextColor="#94A3B8"
              value={newPostText}
              onChangeText={setNewPostText}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setShowAddPostModal(false);
                  setNewPostText('');
                }}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSubmit]}
                onPress={handleCreatePost}
              >
                <Text style={styles.modalBtnSubmitText}>Share Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Slide-Up Comments Modal Feed */}
      {selectedPostForComments && (
        <Modal
          visible={showCommentsModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCommentsModal(false)}
        >
          <View style={styles.commentsModalOverlay}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowCommentsModal(false)} />
            <View style={styles.commentsModalContent}>
              <View style={styles.commentsDragHandle} />

              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>Comments ({postComments.length})</Text>
                <TouchableOpacity 
                  onPress={() => setShowCommentsModal(false)} 
                  style={styles.commentsCloseBtn}
                >
                  <X color="#0F172A" size={18} />
                </TouchableOpacity>
              </View>

              {loadingComments ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator size="small" color="#0E9F6E" />
                </View>
              ) : (
                <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
                  {postComments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <Text style={styles.commentAuthor}>{comment.author_name}</Text>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                  ))}
                  {postComments.length === 0 && (
                    <Text style={styles.noCommentsText}>No comments yet. Write a message below!</Text>
                  )}
                </ScrollView>
              )}

              <View style={styles.commentsInputRow}>
                <TextInput
                  style={styles.commentTextInput}
                  placeholder="Write a comment..."
                  placeholderTextColor="#94A3B8"
                  value={newCommentText}
                  onChangeText={setNewCommentText}
                />
                <TouchableOpacity 
                  style={styles.commentPostBtn} 
                  onPress={handleSendComment}
                >
                  <Text style={styles.commentPostBtnText}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  resetFilterText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  dailyReminderCard: {
    backgroundColor: '#FFFDF9', 
    borderColor: '#FEF3C7',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  dailyReminderLeft: {
    flex: 1.2,
  },
  dailyReminderLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dailyReminderQuote: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    lineHeight: 20,
    marginTop: 8,
    fontStyle: 'italic',
  },
  dailyReminderAuthor: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '600',
  },
  lanternContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  categoryItem: {
    width: '22%',
    alignItems: 'center',
  },
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryIconCircleActive: {
    borderColor: '#0E9F6E',
    backgroundColor: '#E6F4EA',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: '#0E9F6E',
  },
  categoryDesc: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 12,
    color: '#0E9F6E',
    fontWeight: 'bold',
  },
  postsContainer: {
    gap: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F1F5F9',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postUserLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitialsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
  },
  postUserMeta: {
    justifyContent: 'center',
  },
  postUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  postTimeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
    fontWeight: '500',
  },
  postCategoryBadge: {
    color: '#0E9F6E',
    fontWeight: 'bold',
    fontSize: 10,
  },
  moreButton: {
    padding: 4,
  },
  postContentText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginBottom: 14,
  },
  postFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  postFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  postActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionCountText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  shareReminderContainer: {
    position: 'absolute',
    bottom: 90, // Sit nicely above the bottom tab navigation bar (which has height 75)
    left: 20,
    right: 20,
    height: 68,
    backgroundColor: '#E6F4EA', 
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    zIndex: 10,
  },
  shareReminderLeft: {
    flex: 1,
  },
  shareReminderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#046C4E',
  },
  shareReminderDesc: {
    fontSize: 11,
    color: '#0E9F6E',
    marginTop: 2,
    fontWeight: '500',
  },
  floatingAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0E9F6E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0E9F6E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  loaderText: {
    color: '#64748B',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 16,
  },
  pickerChip: {
    flex: 1,
    height: 32,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerChipActive: {
    backgroundColor: '#0E9F6E',
  },
  pickerChipText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: 'bold',
  },
  pickerChipTextActive: {
    color: '#FFFFFF',
  },
  postInput: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    height: 100,
    paddingHorizontal: 16,
    paddingTop: 12,
    color: '#0F172A',
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#F1F5F9',
  },
  modalBtnCancelText: {
    color: '#64748B',
    fontWeight: 'bold',
  },
  modalBtnSubmit: {
    backgroundColor: '#0E9F6E',
  },
  modalBtnSubmitText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  commentsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  commentsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    height: '75%',
  },
  commentsDragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  commentsCloseBtn: {
    padding: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
  },
  commentsList: {
    flex: 1,
    marginBottom: 12,
  },
  commentItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  noCommentsText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 32,
  },
  commentsInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
    color: '#0F172A',
    fontSize: 13,
  },
  commentPostBtn: {
    backgroundColor: '#0E9F6E',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentPostBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
