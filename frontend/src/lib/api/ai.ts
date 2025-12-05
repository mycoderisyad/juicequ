import { apiClient } from "./config";

export interface ChatMessageHistory {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  locale?: string;
  conversation_history?: ChatMessageHistory[];
}

export interface ChatOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  size: "small" | "medium" | "large";
  unit_price: number;
  total_price: number;
  image_url?: string;
  description?: string;
}

export interface ChatOrderData {
  items: ChatOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

export interface FeaturedProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  thumbnail_url?: string;
  category?: string;
  calories?: number;
  is_bestseller: boolean;
  order_count: number;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  context_used?: Array<{ text: string; metadata: Record<string, unknown> }>;
  response_time_ms: number;
  intent?: "order" | "inquiry" | "greeting" | "recommendation" | "navigate" | "add_to_cart" | "off_topic" | "unknown";
  order_data?: ChatOrderData;
  show_checkout: boolean;
  featured_products?: FeaturedProduct[];
  should_navigate?: boolean;
  destination?: string;
}

export interface VoiceResponse {
  transcription: string;
  response: string;
  session_id: string;
  response_time_ms: number;
}

export interface OrderItem {
  product_id?: string;
  product_name: string;
  quantity: number;
  size: "small" | "medium" | "large";
  price?: number;
}

export interface OrderData {
  intent: "order" | "inquiry";
  items: OrderItem[];
  notes?: string;
}

export interface VoiceOrderResponse {
  transcription: string;
  order_data: OrderData;
}

export interface ProductRecommendation {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string;
  calories?: number;
  category_name?: string;
  reason: string;
  score: number;
}

export interface RecommendationResponse {
  recommendations: ProductRecommendation[];
  total: number;
}

export interface AIFeedbackRequest {
  interaction_id: string;
  rating: number;
  feedback?: string;
}

export interface AIFeedbackResponse {
  message: string;
  interaction_id: string;
}

export interface AIInteraction {
  id: string;
  session_id: string;
  interaction_type: "chat" | "voice" | "recommendation";
  status: "active" | "completed" | "abandoned" | "error";
  user_input: string;
  ai_response?: string;
  detected_intent?: string;
  response_time_ms?: number;
  user_rating?: number;
  created_at: string;
  completed_at?: string;
}

export interface AIInteractionListResponse {
  interactions: AIInteraction[];
  total: number;
  page: number;
  page_size: number;
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>("/ai/chat", request);
  return response.data;
}

export async function processVoice(audioBlob: Blob, sessionId?: string): Promise<VoiceResponse> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");
  if (sessionId) formData.append("session_id", sessionId);

  const response = await apiClient.post<VoiceResponse>("/ai/voice", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return response.data;
}

export async function getRecommendations(preferences?: string, limit = 5): Promise<RecommendationResponse> {
  const params = new URLSearchParams();
  if (preferences) params.append("preferences", preferences);
  params.append("limit", limit.toString());
  const response = await apiClient.get<RecommendationResponse>(`/ai/recommendations?${params}`);
  return response.data;
}

export async function processVoiceOrder(audioBlob: Blob): Promise<VoiceOrderResponse> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.webm");
  const response = await apiClient.post<VoiceOrderResponse>("/ai/voice/order", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60000,
  });
  return response.data;
}

export async function submitFeedback(request: AIFeedbackRequest): Promise<AIFeedbackResponse> {
  const response = await apiClient.post<AIFeedbackResponse>("/ai/feedback", request);
  return response.data;
}

export async function getInteractionHistory(page = 1, pageSize = 20): Promise<AIInteractionListResponse> {
  const response = await apiClient.get<AIInteractionListResponse>(`/ai/history?page=${page}&page_size=${pageSize}`);
  return response.data;
}

const aiApi = {
  sendChatMessage,
  processVoice,
  getRecommendations,
  processVoiceOrder,
  submitFeedback,
  getInteractionHistory,
};

export default aiApi;
