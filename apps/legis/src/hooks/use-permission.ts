import { useAuth, userProfile } from "@open-urbis/map-auth";
import { useEffect, useState } from "react";
import { effect } from "@preact/signals";

export function usePermission() {
    const auth = useAuth();
    const [profile, setProfile] = useState(userProfile.value);

    useEffect(() => {
        const dispose = effect(() => {
            setProfile(userProfile.value);
        });
        return () => dispose();
    }, []);

    // Prioritize userProfile signal from API if available, fallback to OIDC profile
    const user = profile || auth.user?.profile;
    
    // Check various common locations for roles in OIDC tokens and API profile
    const role = (user as any)?.role || (user as any)?.job_title || (user as any)?.position;
    const roles = (user as any)?.roles || [];
    const realmRoles = (user as any)?.realm_access?.roles || [];
    const resourceRoles = (user as any)?.resource_access?.['legis']?.roles || [];
    const groups = (user as any)?.groups || [];
    
    // Check deep role assignments from API profile structure
    const roleAssignments = (user as any)?.userRoleAssignments || [];
    const assignedRoles = roleAssignments.map((assignment: any) => assignment?.role?.name).filter(Boolean);

    const allRoles = [
        role,
        ...roles,
        ...realmRoles,
        ...resourceRoles,
        ...groups,
        ...assignedRoles
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
