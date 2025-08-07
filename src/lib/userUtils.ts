import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  roles: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Get user roles from Firestore
 */
export const getUserRoles = async (userId: string): Promise<string[]> => {
  if (!db || !userId) {
    return [];
  }

  try {
    const userProfileRef = doc(db, "users", userId);
    const userSnap = await getDoc(userProfileRef);
    
    if (userSnap.exists()) {
      const profileData = userSnap.data() as UserProfile;
      return profileData.roles || [];
    } else {
      // If no profile exists, default to customer role
      return ["customer"];
    }
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return [];
  }
};

/**
 * Check if user has any of the specified roles
 */
export const hasRole = async (userId: string, roles: string[]): Promise<boolean> => {
  const userRoles = await getUserRoles(userId);
  return userRoles.some(role => roles.includes(role));
};

/**
 * Check if user is admin
 */
export const isAdmin = async (userId: string): Promise<boolean> => {
  return hasRole(userId, ["admin"]);
};

/**
 * Check if user is team member
 */
export const isTeamMember = async (userId: string): Promise<boolean> => {
  return hasRole(userId, ["admin", "team_member"]);
};

/**
 * Check if user is customer
 */
export const isCustomer = async (userId: string): Promise<boolean> => {
  const userRoles = await getUserRoles(userId);
  return userRoles.length === 0 || userRoles.includes("customer");
}; 