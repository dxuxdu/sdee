
export async function getDiscordMemberCount(inviteCode: string = 'HmMArPeN'): Promise<{ total: number; online: number } | null> {
  try {
    const res = await fetch(`https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!res.ok) {
      // Fallback to widget if invite API fails
      const widgetRes = await fetch(`https://discord.com/api/guilds/1333251917098520628/widget.json`, {
        next: { revalidate: 3600 }
      });
      if (widgetRes.ok) {
         const data = await widgetRes.json();
         // Widget only gives online count usually, but let's use what we can
         return { total: 0, online: data.presence_count };
      }
      return null;
    }

    const data = await res.json();
    return {
      total: data.approximate_member_count,
      online: data.approximate_presence_count
    };
  } catch (error) {
    console.error('Failed to fetch Discord stats:', error);
    return null;
  }
}
