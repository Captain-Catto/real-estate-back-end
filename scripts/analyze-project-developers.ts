#!/usr/bin/env node

/**
 * Script để kiểm tra dữ liệu dự án theo chủ đầu tư
 * Xem dự án nào có cùng developer để hiển thị related projects
 */

import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// Import models
import { Project } from "../src/models/Project";
import { Developer } from "../src/models/Developer";

async function connectDb() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

async function analyzeDeveloperData() {
  try {
    console.log("🔍 Analyzing project developer data...\n");

    // Get all projects with developer information
    const projects = await Project.find({}).select(
      "name developer location address status"
    );

    console.log(`📊 Total projects: ${projects.length}`);

    // Check status distribution
    const statusDistribution = new Map();
    projects.forEach((project) => {
      const status = project.status || "no-status";
      statusDistribution.set(status, (statusDistribution.get(status) || 0) + 1);
    });

    console.log("\n📊 Project Status Distribution:");
    Array.from(statusDistribution.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        console.log(`   ${status}: ${count} projects`);
      });

    // Only analyze active projects if they exist, otherwise analyze all
    const activeProjects = projects.filter(
      (p) => p.status === "Đang bán" || p.status === "Sắp mở bán"
    );
    const analyzedProjects =
      activeProjects.length > 0 ? activeProjects : projects;

    console.log(
      `\n🎯 Analyzing: ${analyzedProjects.length} projects (${
        activeProjects.length > 0 ? "selling/upcoming only" : "all projects"
      })\n`
    );

    // Group projects by developer
    const developerGroups = new Map();
    let projectsWithDeveloper = 0;
    let projectsWithoutDeveloper = 0;

    analyzedProjects.forEach((project) => {
      if (project.developer) {
        // Since developer is not populated, it's likely an ObjectId or embedded object
        let developerName = "";
        if (
          typeof project.developer === "object" &&
          (project.developer as any).name
        ) {
          developerName = (project.developer as any).name;
        } else if (typeof project.developer === "string") {
          developerName = project.developer; // If it's stored as string
        } else {
          developerName =
            (project.developer as any)?.toString() || "Unknown Developer";
        }

        if (developerName && developerName !== "Unknown Developer") {
          if (!developerGroups.has(developerName)) {
            developerGroups.set(developerName, []);
          }
          developerGroups.get(developerName).push(project);
          projectsWithDeveloper++;
        } else {
          projectsWithoutDeveloper++;
        }
      } else {
        projectsWithoutDeveloper++;
      }
    });

    console.log(`👥 Projects with developer info: ${projectsWithDeveloper}`);
    console.log(
      `❌ Projects without developer info: ${projectsWithoutDeveloper}\n`
    );

    // Show developers with multiple projects (useful for related projects)
    console.log("🏢 DEVELOPERS WITH MULTIPLE PROJECTS:");
    console.log("=".repeat(60));

    const developersWithMultiple = Array.from(developerGroups.entries())
      .filter(([, projects]) => projects.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (developersWithMultiple.length === 0) {
      console.log("❌ No developers have multiple projects");
    } else {
      developersWithMultiple.forEach(([developerName, developerProjects]) => {
        console.log(
          `\n🏢 ${developerName} (${developerProjects.length} projects):`
        );
        developerProjects.forEach((project: any, index: number) => {
          console.log(`   ${index + 1}. ${project.name}`);
          console.log(`      📍 ${project.address || "Chưa có địa chỉ"}`);
          console.log(
            `      🌍 Province: ${project.location?.provinceCode || "N/A"}`
          );
        });
      });
    }

    // Show developers with single projects
    console.log("\n\n🏢 DEVELOPERS WITH SINGLE PROJECTS:");
    console.log("=".repeat(60));

    const developersWithSingle = Array.from(developerGroups.entries())
      .filter(([, projects]) => projects.length === 1)
      .sort((a, b) => a[0].localeCompare(b[0]));

    console.log(`📊 Count: ${developersWithSingle.length} developers\n`);

    if (developersWithSingle.length > 0) {
      const sampleSize = Math.min(10, developersWithSingle.length);
      console.log(
        `📋 Showing first ${sampleSize} developers with single projects:`
      );

      developersWithSingle
        .slice(0, sampleSize)
        .forEach(([developerName, developerProjects]) => {
          const project = developerProjects[0];
          console.log(`   • ${developerName}: "${project.name}"`);
        });

      if (developersWithSingle.length > sampleSize) {
        console.log(
          `   ... and ${developersWithSingle.length - sampleSize} more`
        );
      }
    }

    // Show location distribution for related projects by location
    console.log("\n\n📍 PROJECTS BY LOCATION (Province):");
    console.log("=".repeat(60));

    const locationGroups = new Map();
    analyzedProjects.forEach((project) => {
      const province = project.location?.provinceCode || "Unknown";
      if (!locationGroups.has(province)) {
        locationGroups.set(province, []);
      }
      locationGroups.get(province).push(project);
    });

    const locationsSorted = Array.from(locationGroups.entries()).sort(
      (a, b) => b[1].length - a[1].length
    );

    locationsSorted.forEach(([provinceCode, locationProjects]) => {
      console.log(`📍 ${provinceCode}: ${locationProjects.length} projects`);

      // Show sample projects in this location
      const sampleProjects = locationProjects.slice(0, 3);
      sampleProjects.forEach((project: any) => {
        let developerName = "No developer";
        if (project.developer) {
          if (
            typeof project.developer === "object" &&
            (project.developer as any).name
          ) {
            developerName = (project.developer as any).name;
          } else if (typeof project.developer === "string") {
            developerName = project.developer;
          } else {
            developerName = (project.developer as any)?.toString() || "Unknown";
          }
        }
        console.log(`   • ${project.name} (${developerName})`);
      });

      if (locationProjects.length > 3) {
        console.log(`   ... and ${locationProjects.length - 3} more`);
      }
      console.log();
    });

    // Summary and recommendations
    console.log("\n🎯 RELATED PROJECTS STRATEGY RECOMMENDATIONS:");
    console.log("=".repeat(60));

    const hasMultipleDeveloperProjects = developersWithMultiple.length > 0;
    const hasLocationDiversity = locationsSorted.length > 1;

    if (hasMultipleDeveloperProjects) {
      console.log("✅ GOOD: Multiple developers have multiple projects");
      console.log("   → Can show related projects by same developer");
      console.log(
        `   → ${developersWithMultiple.length} developers with 2+ projects`
      );
    } else {
      console.log("⚠️  LIMITED: Most developers have only 1 project each");
      console.log("   → Related by developer will be limited");
    }

    if (hasLocationDiversity) {
      console.log("✅ GOOD: Projects spread across multiple provinces");
      console.log("   → Can show related projects by location");
      console.log(`   → ${locationsSorted.length} different provinces`);
    }

    console.log("\n💡 IMPLEMENTATION NOTES:");
    console.log("1. Priority: Same developer → Same location → Any active");
    console.log("2. Current RelatedProjects component strategy is appropriate");
    console.log(
      "3. Consider fallback to 'featured' or 'newest' projects if needed"
    );
  } catch (error) {
    console.error("❌ Error analyzing developer data:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();
    await analyzeDeveloperData();
  } catch (error) {
    console.error("❌ Analysis failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Chạy script
main();

export { analyzeDeveloperData };
