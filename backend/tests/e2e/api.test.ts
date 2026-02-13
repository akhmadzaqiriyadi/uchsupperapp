
import { describe, expect, test, beforeAll } from "bun:test";

const BASE_URL = "http://localhost:3000/api";
let superToken = "";
let staffToken = "";
let staffOrgId = "";
let createdLogId = "";

// Utils
const login = async (email: string, password: string) => {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data: any = await res.json();
  if (!data.data?.token) {
      console.log("Login Error Response:", JSON.stringify(data, null, 2));
  }
  return data.data?.token;
};

const get = async (path: string, token: string): Promise<{ status: number; body: any }> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, body: await res.json() };
};

const post = async (path: string, token: string, body: any): Promise<{ status: number; body: any }> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};

console.log("\n🚀 STARTING COMPREHENSIVE API TEST SUITE...\n");

// 1. AUTHENTICATION
console.log("🔒 TEST 1: Authentication Logic");
const adminToken = await login("admin@uch.ac.id", "password123");
if (adminToken) {
    console.log("✅ Super Admin Login Success");
    superToken = adminToken;
} else {
    console.error("❌ Super Admin Login Failed");
    process.exit(1);
}

const staffLogin = await login("staff@ush.ac.id", "password123");
if (staffLogin) {
    console.log("✅ Staff Login Success");
    staffToken = staffLogin;
} else {
    console.error("❌ Staff Login Failed");
    process.exit(1);
}

// Get Staff Org ID
const me = await get("/auth/me", staffToken);
staffOrgId = me.body.data.organization.id;
console.log(`ℹ️  Staff Organization ID: ${staffOrgId}`);

// 2. DASHBOARD & ANALYTICS
console.log("\n📊 TEST 2: Super Dashboard & Permissions");

// Super Admin Global View
const globalStats = await get("/dashboard/stats", superToken);
if (globalStats.status === 200 && globalStats.body.data.scope === "Global") {
    console.log("✅ Super Adminsees Global Stats");
} else {
    console.error("❌ Super Admin Global Stats Failed");
}

// Super Admin Filter View
const filteredStats = await get(`/dashboard/stats?organizationId=${staffOrgId}`, superToken);
if (filteredStats.status === 200 && filteredStats.body.data.scope === "Organization") {
    console.log("✅ Super Admin can Filter Stats by Org");
} else {
    console.error("❌ Super Admin Filter Stats Failed");
}

// Staff View (Should be auto-filtered)
const staffStats = await get("/dashboard/stats", staffToken);
if (staffStats.status === 200 && staffStats.body.data.scope === "Organization") {
    console.log("✅ Staff sees only Organization Stats (Auto-scoped)");
} else {
    console.error("❌ Staff Dashboard Scope Failed");
}

// Analytics Endpoints
const chart = await get("/dashboard/chart", superToken);
if (chart.status === 200 && Array.isArray(chart.body.data)) {
    console.log(`✅ Chart Data Retrieved (${chart.body.data.length} months)`);
} else {
    console.error("❌ Chart Endpoint Failed");
}

const rankings = await get("/dashboard/rankings?type=EXPENSE", superToken);
if (rankings.status === 200 && Array.isArray(rankings.body.data)) {
    console.log("✅ Expense Rankings Retrieved");
} else {
    console.error("❌ Rankings Endpoint Failed");
}

// 3. FINANCIAL LOGS & RESTRICTIONS
console.log("\n💰 TEST 3: Financial Logs Flow");

// Create Log (Staff)
const newLog = await post("/logs", staffToken, {
    type: "EXPENSE",
    description: "Beli Kopi Coding (Test)",
    totalAmount: 50000,
    items: [
        { itemName: "Kopi Susu", quantity: 2, unitPrice: 25000 }
    ]
});

  if (newLog.status === 200) {
    console.log("✅ Log Created Successfully by Staff");
    createdLogId = newLog.body.data.id;

    // Test Upload Attachment if log created
    if (createdLogId) {
        try {
             // Find a test file
            const testFileName = "blackhat seo.png";
            const file = Bun.file(`tests/assets/${testFileName}`);
            
            if (await file.exists()) {
                const formData = new FormData();
                formData.append("file", file);

                const uploadRes = await fetch(`${BASE_URL}/logs/${createdLogId}/attachments`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${staffToken}` },
                    body: formData,
                });
                
                const uploadData: any = await uploadRes.json();

                if (uploadRes.status === 200 && uploadData.data?.url) {
                    console.log(`✅ Attachment Uploaded Successfully: ${uploadData.data.url}`);
                } else {
                    console.error("❌ Attachment Upload Failed:", uploadData);
                }
            } else {
                console.warn(`⚠️ Test file not found in tests/assets/${testFileName}, skipping upload test.`);
            }
        } catch (e) {
            console.error("❌ Error during upload test:", e);
        }
    }

} else {
    console.error("❌ Create Log Failed:", newLog.body);
}

// 4. SECURITY & PERMISSIONS
console.log("\n🛡️  TEST 4: Security & Edge Cases");

// Staff try to access random org stats (Should be ignored and return own stats or forbidden)
// Using ALL-ZERO UUID which is valid format but likely doesn't exist
const staffTryHack = await get(`/dashboard/stats?organizationId=00000000-0000-0000-0000-000000000000`, staffToken);
if (staffTryHack.status === 200 && staffTryHack.body.data.scope === "Organization") {
    console.log("✅ Staff attempting to filter other org is safely ignored/scoped to own org");
} else {
    console.error("❌ Staff hack attempt check failed");
}

console.log("\n🏁 TEST SUITE COMPLETED.\n");
