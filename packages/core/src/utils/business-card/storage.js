const STORAGE_KEY_PROJECTS = "ai_tools_business_card_projects_v1";
const STORAGE_KEY_ACTIVE_PROJECT_ID = "ai_tools_business_card_active_project_id_v1";
export class StorageService {
  /**
   * Loads all saved projects from LocalStorage
   */
  static getProjects() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error("Error loading projects from storage:", err);
      return [];
    }
  }
  /**
   * Saves or updates a project in LocalStorage
   */
  static saveProject(project) {
    try {
      const projects = this.getProjects();
      const existingIdx = projects.findIndex((p) => p.id === project.id);
      const updatedProject = {
        ...project,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (existingIdx >= 0) {
        projects[existingIdx] = updatedProject;
      } else {
        projects.unshift(updatedProject);
      }
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
      localStorage.setItem(STORAGE_KEY_ACTIVE_PROJECT_ID, project.id);
    } catch (err) {
      console.error("Error saving project to storage:", err);
    }
  }
  /**
   * Gets the currently active project
   */
  static getActiveProject() {
    try {
      const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_PROJECT_ID);
      const projects = this.getProjects();
      if (!projects.length) return null;
      if (!activeId) return projects[0];
      return projects.find((p) => p.id === activeId) || projects[0];
    } catch {
      return null;
    }
  }
  /**
   * Deletes a project by ID
   */
  static deleteProject(id) {
    try {
      const projects = this.getProjects().filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  }
  /**
   * Generates a new card for a different employee using the same master template design
   */
  static applyEmployeeProfileToTemplate(templateProject, newProfile) {
    const newId = `card-emp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const frontElements = templateProject.front.elements.map((el) => {
      if (el.type === "text" && el.fieldBinding) {
        const boundVal = newProfile[el.fieldBinding];
        if (typeof boundVal === "string") {
          return { ...el, content: boundVal };
        }
      }
      return el;
    });
    const backElements = templateProject.back.elements.map((el) => {
      if (el.type === "text" && el.fieldBinding) {
        const boundVal = newProfile[el.fieldBinding];
        if (typeof boundVal === "string") {
          return { ...el, content: boundVal };
        }
      }
      return el;
    });
    return {
      ...templateProject,
      id: newId,
      title: `${newProfile.companyName} - ${newProfile.fullName}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      profile: newProfile,
      front: {
        ...templateProject.front,
        elements: frontElements
      },
      back: {
        ...templateProject.back,
        elements: backElements
      }
    };
  }
  /**
   * Parses CSV content into multiple employee profiles
   */
  static parseEmployeeCsv(csvText, baseProfile) {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length <= 1) return [];
    const profiles = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      if (cols.length >= 1 && cols[0]) {
        profiles.push({
          ...baseProfile,
          fullName: cols[0] || "",
          fullNameKana: cols[1] || "",
          fullNameEn: cols[2] || "",
          jobTitle: cols[3] || baseProfile.jobTitle,
          department: cols[4] || baseProfile.department,
          email: cols[5] || baseProfile.email,
          phone: cols[6] || baseProfile.phone,
          mobile: cols[7] || baseProfile.mobile
        });
      }
    }
    return profiles;
  }
}
