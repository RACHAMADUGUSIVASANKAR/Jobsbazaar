const sanitizeText = (value = '') => String(value || '').trim();

export const normalizeSkills = (skills) => {
    if (Array.isArray(skills)) {
        return [...new Set(skills
            .map((skill) => sanitizeText(skill))
            .filter(Boolean))];
    }

    if (typeof skills === 'string') {
        return [...new Set(skills
            .split(',')
            .map((skill) => sanitizeText(skill))
            .filter(Boolean))];
    }

    return [];
};

export const computeOnboardingState = (user = {}) => {
    const hasName = Boolean(sanitizeText(user?.name));
    const hasGender = Boolean(sanitizeText(user?.gender));
    const normalizedSkills = normalizeSkills(user?.skills);
    const hasProfileSkills = normalizedSkills.length > 0;
    const hasResume = Boolean(sanitizeText(user?.resumeText));

    const hasRequiredProfileDetails = hasName && hasGender && hasProfileSkills;
    const onboardingCompleted = Boolean(user?.onboardingCompleted) || hasRequiredProfileDetails;

    let onboardingSource = 'none';
    if (onboardingCompleted && hasResume) onboardingSource = 'profile+resume';
    else if (onboardingCompleted) onboardingSource = 'profile';

    const onboardingPendingFields = [];
    if (!hasName) onboardingPendingFields.push('name');
    if (!hasGender) onboardingPendingFields.push('gender');
    if (!hasProfileSkills) onboardingPendingFields.push('skills');

    return {
        hasName,
        hasGender,
        hasResume,
        hasProfileSkills,
        hasRequiredProfileDetails,
        onboardingCompleted,
        onboardingComplete: onboardingCompleted,
        onboardingSource,
        onboardingPendingFields,
        canUseResumeData: hasResume,
        normalizedSkills
    };
};
