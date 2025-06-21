import { useEffect, useState } from 'react';
import { databaseService } from '../appwrite';
import { useAuth } from '../auth-context';

export const useHobbies = () => {
    const { user } = useAuth();
    const [hobbies, setHobbies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all user hobbies
    const fetchHobbies = async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            setError(null);
            const response = await databaseService.getUserHobbies(user.$id);
            setHobbies(response.documents);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching hobbies:', err);
        } finally {
            setLoading(false);
        }
    };

    // Create new hobby
    const createHobby = async (hobbyData) => {
        if (!user) return { success: false, error: 'User not authenticated' };

        try {
            setLoading(true);
            setError(null);
            const newHobby = await databaseService.createHobby({
                ...hobbyData,
                userId: user.$id,
                date: new Date().toISOString()
            });
            setHobbies(prev => [newHobby, ...prev]);
            return { success: true, data: newHobby };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Update hobby
    const updateHobby = async (documentId, hobbyData) => {
        try {
            setLoading(true);
            setError(null);
            const updatedHobby = await databaseService.updateHobby(documentId, hobbyData);
            setHobbies(prev => prev.map(hobby => 
                hobby.$id === documentId ? updatedHobby : hobby
            ));
            return { success: true, data: updatedHobby };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Delete hobby
    const deleteHobby = async (documentId) => {
        try {
            setLoading(true);
            setError(null);
            await databaseService.deleteHobby(documentId);
            setHobbies(prev => prev.filter(hobby => hobby.$id !== documentId));
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Get hobbies by date range
    const getHobbiesByDateRange = async (startDate, endDate) => {
        if (!user) return { success: false, error: 'User not authenticated' };

        try {
            setLoading(true);
            setError(null);
            const response = await databaseService.getHobbiesByDateRange(user.$id, startDate, endDate);
            return { success: true, data: response.documents };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Get hobbies by category
    const getHobbiesByCategory = async (category) => {
        if (!user) return { success: false, error: 'User not authenticated' };

        try {
            setLoading(true);
            setError(null);
            const response = await databaseService.getHobbiesByCategory(user.$id, category);
            return { success: true, data: response.documents };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    // Load hobbies on component mount
    useEffect(() => {
        fetchHobbies();
    }, [user]);

    return {
        hobbies,
        loading,
        error,
        fetchHobbies,
        createHobby,
        updateHobby,
        deleteHobby,
        getHobbiesByDateRange,
        getHobbiesByCategory
    };
};