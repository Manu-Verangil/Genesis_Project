import { initialData } from "../server/data/seedData.js";

// Maintain in-memory store in global scope across serverless warm invocations
if (!globalThis._campusIssues) {
  globalThis._campusIssues = JSON.parse(JSON.stringify(initialData.campusIssues || []));
}
if (!globalThis._notifications) {
  globalThis._notifications = JSON.parse(JSON.stringify(initialData.notifications || []));
}

export default async function handler(req, res) {
  // Always set JSON content-type and CORS headers
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const issues = globalThis._campusIssues;

  if (req.method === "GET") {
    try {
      const { category, status, search } = req.query || {};
      let filtered = [...issues];
      if (category && category !== "All") {
        filtered = filtered.filter((i) => i.category?.toLowerCase() === category.toLowerCase());
      }
      if (status && status !== "All") {
        filtered = filtered.filter((i) => i.status === status);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (i) =>
            i.title?.toLowerCase().includes(q) ||
            i.description?.toLowerCase().includes(q) ||
            i.location?.toLowerCase().includes(q)
        );
      }
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ success: true, data: filtered });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch campus issues",
        error: err.message
      });
    }
  }

  if (req.method === "POST") {
    try {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      }
      const { title, category, location, description, priority, photoUrl } = body || {};

      if (!title || !description || !location) {
        return res.status(400).json({
          success: false,
          message: "Title, location and description are required"
        });
      }

      const count = issues.length + 45;
      const ticketNumber = `ISS-2026-${String(count).padStart(3, "0")}`;

      // Department auto-routing based on category
      let department = "Campus Estate Management";
      const catLower = (category || "").toLowerCase();
      if (catLower.includes("wifi") || catLower.includes("it")) {
        department = "Campus IT Network Services";
      } else if (catLower.includes("water") || catLower.includes("plumbing")) {
        department = "Estate & Plumbing Facilities";
      } else if (catLower.includes("electric") || catLower.includes("power")) {
        department = "Electrical Maintenance Cell";
      } else if (catLower.includes("sanitation") || catLower.includes("restroom")) {
        department = "Housekeeping & Campus Hygiene";
      } else if (catLower.includes("classroom") || catLower.includes("projector")) {
        department = "Audio-Visual Technical Team";
      }

      const newIssue = {
        id: `iss_${Date.now()}`,
        ticketNumber,
        title,
        category: category || "General Facilities",
        location,
        description,
        priority: priority || "Medium",
        status: "reported", // Stage 1
        currentStageIndex: 1, // 1: Report, 2: Route, 3: Act, 4: Notify, 5: Resolve
        reportedBy: "Karthik (CS24B001)",
        department,
        assignedStaff: "Pending Route",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        photoUrl: photoUrl || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=80",
        timeline: [
          {
            stage: "Report",
            status: "reported",
            message: "Issue reported by student with problem details and location marker.",
            timestamp: new Date().toISOString(),
            actor: "Karthik"
          }
        ]
      };

      issues.unshift(newIssue);

      if (globalThis._notifications) {
        globalThis._notifications.unshift({
          id: `nt_${Date.now()}`,
          title: `Campus Issue Created (${ticketNumber})`,
          message: `Your issue "${title}" was logged and queued for administrative routing.`,
          type: "issue",
          timestamp: new Date().toISOString(),
          read: false
        });
      }

      return res.status(201).json({
        success: true,
        data: newIssue,
        message: `Issue logged under ticket #${ticketNumber}`
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Failed to submit campus issue",
        error: err.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: `Method ${req.method} Not Allowed`
  });
}
