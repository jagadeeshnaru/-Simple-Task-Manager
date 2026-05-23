const STORAGE_KEY = "codex.todo.tasks";

const form = document.querySelector("#todoForm");
const input = document.querySelector("#todoInput");
const priorityInput = document.querySelector("#priorityInput");
const dueInput = document.querySelector("#dueInput");
const list = document.querySelector("#todoList");
const filters = document.querySelectorAll(".filter");
const clearDone = document.querySelector("#clearDone");
const taskCount = document.querySelector("#taskCount");
const progressValue = document.querySelector("#progressValue");
const progressRing = document.querySelector(".progress-ring");
const dateLabel = document.querySelector("#dateLabel");
const emptyTemplate = document.querySelector("#emptyTemplate");

let todos = loadTodos();
let currentFilter = "all";

dateLabel.textContent = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "short",
  day: "numeric",
}).format(new Date());

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) return;

  todos.unshift({
    id: crypto.randomUUID(),
    text,
    priority: priorityInput.value,
    due: dueInput.value,
    done: false,
    createdAt: Date.now(),
  });

  input.value = "";
  priorityInput.value = "normal";
  dueInput.value = "";
  saveAndRender();
});

filters.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    filters.forEach((item) => item.classList.toggle("active", item === button));
    render();
  });
});

clearDone.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.done);
  saveAndRender();
});

function render() {
  list.replaceChildren();

  const visibleTodos = todos.filter((todo) => {
    if (currentFilter === "active") return !todo.done;
    if (currentFilter === "done") return todo.done;
    return true;
  });

  if (visibleTodos.length === 0) {
    list.append(emptyTemplate.content.cloneNode(true));
  } else {
    visibleTodos.forEach((todo) => list.append(createTodoElement(todo)));
  }

  updateSummary();
}

function createTodoElement(todo) {
  const item = document.createElement("li");
  item.className = `todo-item${todo.done ? " done" : ""}`;

  const check = document.createElement("button");
  check.className = "check";
  check.type = "button";
  check.setAttribute("aria-label", todo.done ? "Mark active" : "Mark done");
  check.textContent = todo.done ? "✓" : "";
  check.addEventListener("click", () => {
    todo.done = !todo.done;
    saveAndRender();
  });

  const main = document.createElement("div");
  main.className = "task-main";

  const text = document.createElement("div");
  text.className = "task-text";
  text.textContent = todo.text;

  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.append(createPill(todo.priority));

  if (todo.due) {
    const due = document.createElement("span");
    due.textContent = `Due ${formatDueDate(todo.due)}`;
    meta.append(due);
  }

  main.append(text, meta);

  const actions = document.createElement("div");
  actions.className = "actions";

  const edit = document.createElement("button");
  edit.className = "icon-button";
  edit.type = "button";
  edit.title = "Edit";
  edit.setAttribute("aria-label", "Edit task");
  edit.textContent = "Edit";
  edit.addEventListener("click", () => startEditing(todo, main));

  const remove = document.createElement("button");
  remove.className = "icon-button";
  remove.type = "button";
  remove.title = "Delete";
  remove.setAttribute("aria-label", "Delete task");
  remove.textContent = "X";
  remove.addEventListener("click", () => {
    todos = todos.filter((itemTodo) => itemTodo.id !== todo.id);
    saveAndRender();
  });

  actions.append(edit, remove);
  item.append(check, main, actions);

  return item;
}

function startEditing(todo, container) {
  const editInput = document.createElement("input");
  editInput.className = "edit-input";
  editInput.value = todo.text;
  editInput.maxLength = 80;

  container.replaceChildren(editInput);
  editInput.focus();
  editInput.select();

  const finish = () => {
    const nextText = editInput.value.trim();
    if (nextText) {
      todo.text = nextText;
    }
    saveAndRender();
  };

  editInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") finish();
    if (event.key === "Escape") render();
  });
  editInput.addEventListener("blur", finish, { once: true });
}

function createPill(priority) {
  const pill = document.createElement("span");
  pill.className = `pill ${priority}`;
  pill.textContent = priority[0].toUpperCase() + priority.slice(1);
  return pill;
}

function updateSummary() {
  const total = todos.length;
  const done = todos.filter((todo) => todo.done).length;
  const active = total - done;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  taskCount.textContent = total === 0 ? "No tasks yet" : `${active} active, ${done} done`;
  progressValue.textContent = `${percent}%`;
  progressRing.style.background = `conic-gradient(var(--accent) ${percent * 3.6}deg, #e6ece9 0deg)`;
  clearDone.disabled = done === 0;
}

function formatDueDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function saveAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  render();
}

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

render();
