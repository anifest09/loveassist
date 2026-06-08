#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Build ❤️ LoveAssist AI — a mobile conversation wingman with AI reply suggestions, screenshot analysis,
  first message generator, modes (Normal/Flirty/Exclusive-Premium), 5 languages, 7-day trial + simulated
  Stripe upgrade, Emergent Google auth (with demo dev-login for preview), safety filters.

backend:
  - task: "Auth: Google session + dev-login + me + logout"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST /api/auth/dev-login should create user + session, POST /api/auth/google/session calls Emergent OAuth, GET /api/auth/me returns user+sub, POST /api/auth/logout clears session. Bearer token required for protected routes."
  - task: "Subscription: status / start-trial / upgrade"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Simulated Stripe. /api/subscription/status returns subscription. start-trial creates 7d trial. upgrade extends to 30d active."
  - task: "AI: /api/ai/suggestions, /api/ai/first-message, /api/ai/screenshot (Claude Sonnet 4.5)"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "All call emergentintegrations LlmChat with anthropic/claude-sonnet-4-5-20250929. Exclusive mode requires trialing or active sub (402 otherwise). Screenshot accepts base64."
  - task: "History: save/list/delete"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "POST/GET/DELETE /api/history scoped by user_id."
  - task: "Settings: PATCH /api/me/settings"
    implemented: true
    working: "NA"
    file: "backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Updates preferred_language and default_mode."

frontend:
  - task: "Login screen (Google + Demo) + Auth context"
    implemented: true
    working: "NA"
    file: "frontend/app/login.tsx, frontend/src/auth-context.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Demo button calls /api/auth/dev-login. Google button opens Emergent OAuth and parses session_id from redirect."
  - task: "Tabs (Home/History/Premium/Profile)"
    implemented: true
    working: "NA"
    file: "frontend/app/(tabs)/*.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Bottom tabs with terracotta accent."
  - task: "Reply Suggestions screen"
    implemented: true
    working: "NA"
    file: "frontend/app/suggest.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Relationship chips, mode selector, situation input, generate -> cards with copy."
  - task: "First Message screen"
    implemented: true
    working: "NA"
    file: "frontend/app/first-message.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "About-person + extra context inputs, mode selector, generate."
  - task: "Screenshot Analysis screen + permissions"
    implemented: true
    working: "NA"
    file: "frontend/app/screenshot.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "expo-image-picker permission flow, base64 to /api/ai/screenshot. Note: image picker is native — web preview cannot pick files; backend endpoint can still be tested directly."
  - task: "Premium tab (start trial / upgrade)"
    implemented: true
    working: "NA"
    file: "frontend/app/(tabs)/premium.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Calls /api/subscription/* and refreshes auth context."
  - task: "Profile tab (language + default mode + signout)"
    implemented: true
    working: "NA"
    file: "frontend/app/(tabs)/profile.tsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "5 languages selectable. Exclusive mode locked unless premium."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: true

test_plan:
  current_focus:
    - "Auth: Google session + dev-login + me + logout"
    - "AI: /api/ai/suggestions, /api/ai/first-message, /api/ai/screenshot (Claude Sonnet 4.5)"
    - "Subscription: status / start-trial / upgrade"
    - "Login screen (Google + Demo) + Auth context"
    - "Reply Suggestions screen"
    - "First Message screen"
    - "Premium tab (start trial / upgrade)"
    - "Profile tab (language + default mode + signout)"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: |
      Initial MVP scaffold complete. Frontend renders login at /login (verified via screenshot).
      Use demo button or POST /api/auth/dev-login {"name":"Demo","email":"demo+<random>@loveassist.ai"}
      to obtain a Bearer session_token for backend tests.
      Test all endpoints listed above end-to-end. For frontend, please use the "Try a demo account"
      button to sign in (Google OAuth will not complete in headless preview).
      The image picker for screenshot analysis cannot be exercised in a web preview — please test the
      backend /api/ai/screenshot endpoint directly with a small base64 jpeg.
