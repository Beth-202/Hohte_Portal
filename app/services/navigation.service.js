// services/navigation.service.js
export class NavigationService {
  constructor() {
    this.routes = {
      home: { path: "/home", name: "home" },
      courses: { path: "/courses", name: "courses" },
      courseDetail: { path: "/courses/:id", name: "courses-id" },
      permissionRequest: {
        path: "/permission/request",
        name: "permission-request",
      },
      permissionStatus: {
        path: "/permission/status",
        name: "permission-status",
      },
      profile: { path: "/profile", name: "profile" },
      classChange: { path: "/class-change", name: "class-change" },
      // ========== NEW: EVALUATIONS ROUTES ==========
      evaluations: {
        path: "/evaluations",
        name: "evaluations",
      },
      evaluationForm: {
        path: "/evaluations/:subjectId",
        name: "evaluations-subjectId",
      },
      messages: { path: "/messages", name: "messages" },
      alerts: { path: "/alerts", name: "alerts" },
    };
  }

  getRoute(routeName, params = {}) {
    const route = this.routes[routeName];
    if (!route) return "/home";

    let path = route.path;
    Object.keys(params).forEach((key) => {
      path = path.replace(`:${key}`, params[key]);
    });

    return path;
  }

  navigate(router, routeName, params = {}) {
    const path = this.getRoute(routeName, params);
    router.push(path);
  }

  getActiveNav(route) {
    const routeMap = {
      "/": "home",
      "/home": "home",
      "/courses": "courses",
      "/courses/*": "courses",
      "/permission/request": "permission",
      "/permission/status": "status",
      "/profile": "profile",
      "/profile/*": "profile",
      "/class-change": "class-change",
      "/class-change/*": "class-change",
      "/evaluations": "evaluations",
      "/evaluations/*": "evaluations",
      "/messages": "messages",
      "/alerts": "alerts",
    };

    for (const [pattern, nav] of Object.entries(routeMap)) {
      if (
        pattern.endsWith("*") &&
        route.path.startsWith(pattern.slice(0, -1))
      ) {
        return nav;
      }
      if (route.path === pattern) {
        return nav;
      }
    }
    return "home";
  }

  // ========== NAVIGATION METHODS ==========
  goBack(router) {
    router.back();
  }

  goToHome(router) {
    this.navigate(router, "home");
  }

  goToCourses(router) {
    this.navigate(router, "courses");
  }

  goToCourseDetail(router, id) {
    this.navigate(router, "courseDetail", { id });
  }

  goToPermissionRequest(router) {
    this.navigate(router, "permissionRequest");
  }

  goToPermissionStatus(router) {
    this.navigate(router, "permissionStatus");
  }

  goToProfile(router) {
    this.navigate(router, "profile");
  }

  goToClassChange(router) {
    this.navigate(router, "classChange");
  }

  // ========== NEW: EVALUATIONS NAVIGATION ==========
  goToEvaluations(router) {
    this.navigate(router, "evaluations");
  }

  goToEvaluation(router, subjectId) {
    this.navigate(router, "evaluationForm", { subjectId });
  }

  goToMessages(router) {
    this.navigate(router, "messages");
  }

  goToAlerts(router) {
    this.navigate(router, "alerts");
  }
}

export const navigationService = new NavigationService();