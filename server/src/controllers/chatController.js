import { chatService } from '../services/chat/chatService.js';

export const handleChat = async (req, res, next) => {
  try {
    const { message, conversationId, history, temperature } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'A non-empty message string is required.',
      });
    }

    const result = await chatService.sendMessage({
      message,
      conversationId,
      history,
      temperature,
    });

    // Provide both top-level keys and nested standard data envelope for maximum client flexibility
    return res.status(200).json({
      success: true,
      reply: result.reply,
      provider: result.provider,
      model: result.model,
      conversationId: result.conversationId,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getChatStatus = async (req, res, next) => {
  try {
    const status = await chatService.getStatus();
    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  handleChat,
  getChatStatus,
};
