import { useAuth, userProfile } from "@open-urbis/map-auth";

export function usePermission() {
    const auth = useAuth();
    // Prioritize userProfile signal from API if available, fallback to OIDC profile
    const user = userProfile.value || auth.user?.profile;
    
    // Check various common locations for roles in OIDC tokens and API profile
    const role = (user as any)?.role || (user as any)?.job_title;
    const roles = (user as any)?.roles || [];
    const realmRoles = (user as any)?.realm_access?.roles || [];
    const resourceRoles = (user as any)?.resource_access?.['legis']?.roles || [];
    const groups = (user as any)?.groups || [];

    const allRoles = [
        role,
        ...roles,
        ...realmRoles,
        ...resourceRoles,
        ...groups
    ].filter(Boolean).map(r => String(r).toLowerCase());

    const isAdmin = allRoles.some(r => r.includes('admin') || r === 'administrator' || r === 'gestor');
    
    return {
        isAdmin,
        canEdit: isAdmin,
        canDelete: isAdmin,
        canCreate: isAdmin,
        // Anyone can view public pages, authenticated can view internal? 
        // For now focusing on edit/create restrictions.
    };
}
