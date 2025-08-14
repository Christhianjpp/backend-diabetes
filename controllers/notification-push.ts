import { Request, Response } from 'express';
import { Expo } from 'expo-server-sdk';
import { PushNotificationService } from '../services/pushNotification';
import User from '../models/user';

const notificationService = new PushNotificationService();

export const sendNotification = async (req: Request, res: Response): Promise<void> => {
  const { tokens, title, body, data } = req.body;

  if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
    res.status(400).json({ message: 'Tokens array is required and cannot be empty' });
    return;
  }

  if (!title || !body) {
    res.status(400).json({ message: 'Title and body are required' });
    return;
  }

  try {
    const result = await notificationService.sendNotification({
      tokens,
      title,
      body,
      data: data || {}
    });
    res.json(result);
  } catch (error: any) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: error.message });
  }
};

export const registerPushToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pushToken, device, deviceInfo } = req.body;
    const user = (req as any).user; // User is set by validateJWT middleware

    // Enhanced logging
    console.log(`📱 Token registration for user: ${user?.userName || user?._id}`);
    console.log(`🔑 Device: ${device || 'unknown'}`);

    // Validation
    if (!pushToken || pushToken.trim() === '') {
      console.log('❌ Invalid or empty push token');
      res.status(400).json({ message: 'Push token is required and cannot be empty' });
      return;
    }

    if (!user) {
      console.log('❌ No authenticated user found');
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Validate token format for Expo
    if (!Expo.isExpoPushToken(pushToken)) {
      console.log('❌ Invalid Expo push token format');
      res.status(400).json({ message: 'Invalid Expo push token' });
      return;
    }

    // Initialize pushTokens array if it doesn't exist
    if (!user.pushTokens) {
      user.pushTokens = [];
    }

    const beforeCount = user.pushTokens.length;

    // Check if token already exists for this user
    const existingTokenIndex = user.pushTokens.findIndex(
      (tokenObj: any) => tokenObj.token === pushToken
    );

    let actionTaken = '';

    if (existingTokenIndex !== -1) {
      // Update existing token info
      console.log('♻️  Token already exists, updating...');
      user.pushTokens[existingTokenIndex] = {
        token: pushToken,
        device: device || user.pushTokens[existingTokenIndex].device || 'unknown',
        createdAt: new Date()
      };
      actionTaken = 'updated';
    } else {
      // Add new token
      console.log('➕ Adding new token...');
      user.pushTokens.push({
        token: pushToken,
        device: device || 'unknown',
        createdAt: new Date()
      });
      actionTaken = 'added';
    }

    // Keep only the last 5 tokens per user (cleanup old ones)
    if (user.pushTokens.length > 5) {
      console.log(`🧹 Cleaning up old tokens (${user.pushTokens.length} -> 5)`);
      user.pushTokens = user.pushTokens
        .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);
    }

    await user.save();

    const afterCount = user.pushTokens.length;
    console.log(`✅ Token ${actionTaken} successfully. Tokens: ${beforeCount} -> ${afterCount}`);

    res.json({ 
      message: `Push token ${actionTaken} successfully`,
      tokenCount: user.pushTokens.length,
      action: actionTaken
    });

  } catch (error: any) {
    console.error('❌ Error in registerPushToken:', error);
    
    // Handle specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      res.status(400).json({ 
        message: 'Token validation failed', 
        details: error.message 
      });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const removePushToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pushToken } = req.body;
    const user = (req as any).user; // User is set by validateJWT middleware

    // Enhanced logging
    console.log(`🗑️  Token removal for user: ${user?.userName || user?._id}`);

    // Validation
    if (!pushToken || pushToken.trim() === '') {
      console.log('❌ Invalid or empty push token');
      res.status(400).json({ message: 'Push token is required and cannot be empty' });
      return;
    }

    if (!user) {
      console.log('❌ No authenticated user found');
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Initialize pushTokens array if it doesn't exist
    if (!user.pushTokens) {
      user.pushTokens = [];
    }

    const beforeCount = user.pushTokens.length;
    console.log(`📊 User has ${beforeCount} tokens before removal`);

    // Remove the token
    user.pushTokens = user.pushTokens.filter(
      (tokenObj: any) => tokenObj.token !== pushToken
    );

    const afterCount = user.pushTokens.length;
    const tokensRemoved = beforeCount - afterCount;

    await user.save();

    if (tokensRemoved > 0) {
      console.log(`✅ Successfully removed ${tokensRemoved} token(s). Remaining: ${afterCount}`);
    } else {
      console.log(`⚠️  Token not found in user's collection`);
    }

    res.json({ 
      message: tokensRemoved > 0 ? 'Push token removed successfully' : 'Token not found',
      tokenCount: user.pushTokens.length,
      tokensRemoved
    });

  } catch (error: any) {
    console.error('❌ Error in removePushToken:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user; // User is set by validateJWT middleware

    if (!user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // Initialize pushTokens array if it doesn't exist
    if (!user.pushTokens) {
      user.pushTokens = [];
    }

    // Return tokens without exposing full token strings (for security)
    const tokensInfo = user.pushTokens.map((tokenObj: any) => ({
      device: tokenObj.device,
      createdAt: tokenObj.createdAt,
      tokenPreview: tokenObj.token.substring(0, 10) + '...'
    }));

    res.json({ 
      tokens: tokensInfo,
      count: user.pushTokens.length 
    });

  } catch (error: any) {
    console.error('Error getting user tokens:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsersTokens = async (req: Request, res: Response): Promise<void> => {
  try {
    // Buscar todos los usuarios activos que tengan pushTokens
    const users = await User.find({ 
      state: true,
      pushTokens: { $exists: true, $ne: [] }
    }).select('userName email pushTokens rol');

    // Extraer todos los tokens con información del usuario
    const allTokens: Array<{
      token: string;
      device: string;
      createdAt: Date;
      userId: string;
      userName: string;
      email: string;
      rol: string;
    }> = [];

    users.forEach(user => {
      if (user.pushTokens && user.pushTokens.length > 0) {
        user.pushTokens.forEach((tokenObj: any) => {
          allTokens.push({
            token: tokenObj.token,
            device: tokenObj.device || 'unknown',
            createdAt: tokenObj.createdAt,
            userId: user.id,
            userName: user.userName,
            email: user.email,
            rol: user.rol
          });
        });
      }
    });

    // Estadísticas
    const stats = {
      totalUsers: users.length,
      totalTokens: allTokens.length,
      tokensByRole: allTokens.reduce((acc: any, token) => {
        acc[token.rol] = (acc[token.rol] || 0) + 1;
        return acc;
      }, {})
    };

    console.log(`📊 Retrieved ${allTokens.length} tokens from ${users.length} users`);

    res.json({
      message: 'All users tokens retrieved successfully',
      tokens: allTokens,
      stats
    });

  } catch (error: any) {
    console.error('❌ Error getting all users tokens:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUsersTokensOnly = async (req: Request, res: Response): Promise<void> => {
  try {
    // Buscar todos los usuarios activos que tengan pushTokens
    const users = await User.find({ 
      state: true,
      pushTokens: { $exists: true, $ne: [] }
    }).select('pushTokens');

    // Extraer solo los tokens como array plano
    const tokens: string[] = [];

    users.forEach(user => {
      if (user.pushTokens && user.pushTokens.length > 0) {
        user.pushTokens.forEach((tokenObj: any) => {
          tokens.push(tokenObj.token);
        });
      }
    });

    console.log(`📱 Retrieved ${tokens.length} tokens from ${users.length} users`);

    res.json({
      message: 'All tokens retrieved successfully',
      tokens,
      count: tokens.length
    });

  } catch (error: any) {
    console.error('❌ Error getting all tokens:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const sendNotificationToUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, title, body, data } = req.body;

    // Validaciones
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    if (!title || !body) {
      res.status(400).json({ message: 'Title and body are required' });
      return;
    }

    // Buscar el usuario por ID
    const user = await User.findById(userId).select('userName pushTokens state');
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.state) {
      res.status(400).json({ message: 'User is not active' });
      return;
    }

    // Verificar si el usuario tiene tokens
    if (!user.pushTokens || user.pushTokens.length === 0) {
      console.log(`⚠️  User ${user.userName} has no push tokens`);
      res.status(400).json({ message: 'User has no push tokens registered' });
      return;
    }

    // Extraer los tokens del usuario
    const userTokens = user.pushTokens.map((tokenObj: any) => tokenObj.token);

    console.log(`📱 Sending notification to user: ${user.userName} (${userTokens.length} tokens)`);

    // Enviar la notificación
    const result = await notificationService.sendNotification({
      tokens: userTokens,
      title,
      body,
      data: data || {}
    });

    console.log(`✅ Notification sent to ${user.userName}:`, result);

    res.json({
      message: `Notification sent successfully to ${user.userName}`,
      user: {
        id: user.id,
        userName: user.userName,
        tokensCount: userTokens.length
      },
      result
    });

  } catch (error: any) {
    console.error('❌ Error sending notification to user:', error);
    res.status(500).json({ message: error.message });
  }
};

export const sendNotificationToAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, body, data, roleFilter } = req.body;

    // Validaciones
    if (!title || !body) {
      res.status(400).json({ message: 'Title and body are required' });
      return;
    }

    // Construir filtro de búsqueda
    let searchFilter: any = { 
      state: true,
      pushTokens: { $exists: true, $ne: [] }
    };

    // Filtrar por rol si se especifica
    if (roleFilter && Array.isArray(roleFilter) && roleFilter.length > 0) {
      searchFilter.rol = { $in: roleFilter };
    }

    // Buscar usuarios que cumplan los criterios
    const users = await User.find(searchFilter).select('userName pushTokens rol');

    if (users.length === 0) {
      res.status(404).json({ message: 'No users found with push tokens' });
      return;
    }

    // Extraer todos los tokens
    const allTokens: string[] = [];
    const userSummary: Array<{
      userId: string;
      userName: string;
      rol: string;
      tokensCount: number;
    }> = [];

    users.forEach(user => {
      if (user.pushTokens && user.pushTokens.length > 0) {
        const userTokens = user.pushTokens.map((tokenObj: any) => tokenObj.token);
        allTokens.push(...userTokens);
        
        userSummary.push({
          userId: user.id,
          userName: user.userName,
          rol: user.rol,
          tokensCount: userTokens.length
        });
      }
    });

    if (allTokens.length === 0) {
      res.status(400).json({ message: 'No valid tokens found' });
      return;
    }

    console.log(`📢 Sending notification to ${users.length} users (${allTokens.length} tokens)`);
    if (roleFilter) {
      console.log(`🎯 Role filter applied: ${roleFilter.join(', ')}`);
    }

    // Enviar la notificación
    const result = await notificationService.sendNotification({
      tokens: allTokens,
      title,
      body,
      data: data || {}
    });

    console.log(`✅ Mass notification sent:`, result);

    // Estadísticas por rol
    const roleStats = userSummary.reduce((acc: any, user) => {
      acc[user.rol] = (acc[user.rol] || 0) + 1;
      return acc;
    }, {});

    res.json({
      message: `Notification sent successfully to ${users.length} users`,
      stats: {
        totalUsers: users.length,
        totalTokens: allTokens.length,
        roleStats,
        appliedRoleFilter: roleFilter || null
      },
      users: userSummary,
      result
    });

  } catch (error: any) {
    console.error('❌ Error sending mass notification:', error);
    res.status(500).json({ message: error.message });
  }
};
