import { supabase } from "./supabase";

export interface SalesSummary {
    totalRevenue: number;
    totalEnrollments: number;
    completedCourses: number;
    popularCourses: { title: string; count: number }[];
    engagementRate: string;
    recentSales: any[];
}

export async function getAdminAnalyticsSummary(): Promise<SalesSummary> {
    try {
        // 1. Get Paid Enrollments count and sum
        const { data: enrollments, error } = await supabase
            .from("enrollments")
            .select("payment_amount, payment_status, course_title, enrolled_at")
            .in("payment_status", ["paid", "completed"]);

        if (error) throw error;

        const totalRevenue = enrollments.reduce((sum, e) => sum + (e.payment_amount || 0), 0);
        const totalEnrollments = enrollments.length;
        const completedCourses = enrollments.filter(e => e.payment_status === 'completed').length;

        // 2. Calculate popular courses
        const courseCounts: Record<string, number> = {};
        enrollments.forEach(e => {
            const title = e.course_title || "Unknown Course";
            courseCounts[title] = (courseCounts[title] || 0) + 1;
        });

        const popularCourses = Object.entries(courseCounts)
            .map(([title, count]) => ({ title, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // 3. Compute Engagement Rate (Real)
        // Ratio of completed items vs total items across all active enrollments
        const { data: progressData } = await supabase
            .from("lesson_progress")
            .select("id");
        
        const { data: totalLessons } = await supabase
            .from("lessons")
            .select("id", { count: 'exact' });

        const engagementRate = totalEnrollments > 0 
            ? Math.round(((progressData?.length || 0) / ((totalLessons?.length || 1) * totalEnrollments)) * 100) 
            : 0;

        return {
            totalRevenue,
            totalEnrollments,
            completedCourses,
            popularCourses,
            engagementRate: `${engagementRate}%`,
            recentSales: enrollments.sort((a, b) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime()).slice(0, 5)
        };
    } catch (err) {
        console.error("Error fetching analytics:", err);
        return {
            totalRevenue: 0,
            totalEnrollments: 0,
            completedCourses: 0,
            popularCourses: [],
            engagementRate: "0%",
            recentSales: []
        };
    }
}

export async function getExtraInsights() {
    /* 
     * TODO: [HARDCODED PLACEHOLDERS]
     * These statistics are currently faked for UI demonstration.
     * Must be replaced with real tracked metrics from DB (e.g. user_agents for mobile).
     */
    return {
        mobileUsers: "42%", 
        averageWatchTime: "18.5m"
    };
}

export async function getYearlyRevenue(): Promise<{ month: string; revenue: number }[]> {
    try {
         const { data, error } = await supabase
            .from("enrollments")
            .select("payment_amount, enrolled_at")
            .in("payment_status", ["paid", "completed"]);
        
        if (error) throw error;

        const monthlyData: Record<string, number> = {};
        const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

        data.forEach(enr => {
            const date = new Date(enr.enrolled_at);
            const monthLabel = months[date.getMonth()];
            monthlyData[monthLabel] = (monthlyData[monthLabel] || 0) + (enr.payment_amount || 0);
        });

        return months.map(m => ({ month: m, revenue: monthlyData[m] || 0 }));
    } catch {
        return [];
    }
}
