import { Account, Client, Databases, ID, Query } from 'appwrite';

// Initialize Appwrite Client
const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

// Initialize Appwrite Services
export const account = new Account(client);
export const databases = new Databases(client);

// Database and Collection IDs
export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
export const HOBBIES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_HOBBIES_COLLECTION_ID;

// Session Management Utility
const sessionManager = {
  async ensureActiveSession() {
    try {
      // Try to get current session
      await account.get();
      return true;
    } catch (error) {
      if (error.code === 401) {
        console.log('No active session, creating anonymous session...');
        try {
          await account.createAnonymousSession();
          return true;
        } catch (anonError) {
          console.error('Failed to create anonymous session:', anonError);
          return false;
        }
      }
      console.error('Session verification failed:', error);
      return false;
    }
  }
};

// Secure Request Wrapper
const withSession = async (operation) => {
  const hasSession = await sessionManager.ensureActiveSession();
  if (!hasSession) {
    throw new Error('Unable to establish session');
  }
  return operation();
};

// Authentication Service
export const authService = {
  async createAccount(email, password, name) {
    return withSession(() =>
      account.create(ID.unique(), email, password, name)
    );
  },

  async login(email, password) {
    return withSession(() =>
      account.createEmailPasswordSession(email, password)
    );
  },

  async getCurrentUser() {
    return withSession(() => account.get());
  },

  async logout() {
    return withSession(() => account.deleteSession('current'));
  }
};

// Database Service
export const databaseService = {
  async createHobby(hobbyData) {
    return withSession(() =>
      databases.createDocument(
        DATABASE_ID,
        HOBBIES_COLLECTION_ID,
        ID.unique(),
        hobbyData
      )
    );
  },

  async getUserHobbies(userId) {
    return withSession(() =>
      databases.listDocuments(
        DATABASE_ID,
        HOBBIES_COLLECTION_ID,
        [Query.equal('userId', userId)]
      )
    );
  },

  async updateHobby(documentId, hobbyData) {
    return withSession(() =>
      databases.updateDocument(
        DATABASE_ID,
        HOBBIES_COLLECTION_ID,
        documentId,
        hobbyData
      )
    );
  },

  async deleteHobby(documentId) {
    return withSession(() =>
      databases.deleteDocument(
        DATABASE_ID,
        HOBBIES_COLLECTION_ID,
        documentId
      )
    );
  }
};

// Debug Utilities
export const debug = {
  async printAuthStatus() {
    try {
      const session = await account.getSession('current');
      const user = await account.get();
      console.log('Current Session:', session);
      console.log('Current User:', user);
      return { session, user };
    } catch (error) {
      console.log('No active session:', error.message);
      return null;
    }
  }
};

export { ID, Query };
