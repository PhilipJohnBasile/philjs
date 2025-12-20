<template>
  <div class="todo-island" :style="containerStyle">
    <h3>Vue Todo List</h3>
    <div style="margin-bottom: 15px;">
      <input
        v-model="newTodo"
        @keyup.enter="addTodo"
        placeholder="Enter a todo..."
        :style="inputStyle"
      />
      <button @click="addTodo" :style="buttonStyle">Add</button>
    </div>
    <ul style="list-style: none; padding: 0;">
      <li
        v-for="todo in todos"
        :key="todo.id"
        :style="todoStyle"
      >
        <input
          type="checkbox"
          v-model="todo.completed"
          style="margin-right: 10px;"
        />
        <span :style="{ textDecoration: todo.completed ? 'line-through' : 'none' }">
          {{ todo.text }}
        </span>
        <button
          @click="removeTodo(todo.id)"
          :style="deleteButtonStyle"
        >
          ✕
        </button>
      </li>
    </ul>
    <p style="margin-top: 15px; opacity: 0.7;">
      {{ completedCount }} / {{ todos.length }} completed
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const props = defineProps<{
  initialTodos?: string[];
}>();

const newTodo = ref('');
const todos = ref<Todo[]>(
  props.initialTodos?.map((text, index) => ({
    id: index,
    text,
    completed: false
  })) || []
);
let nextId = todos.value.length;

const completedCount = computed(() =>
  todos.value.filter(t => t.completed).length
);

function addTodo() {
  if (newTodo.value.trim()) {
    todos.value.push({
      id: nextId++,
      text: newTodo.value.trim(),
      completed: false
    });
    newTodo.value = '';
  }
}

function removeTodo(id: number) {
  todos.value = todos.value.filter(t => t.id !== id);
}

const containerStyle = {
  padding: '20px',
  border: '2px solid #42b883',
  borderRadius: '8px',
  backgroundColor: '#f9f9f9',
  color: '#2c3e50'
};

const inputStyle = {
  padding: '8px 12px',
  fontSize: '14px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  marginRight: '8px',
  width: '200px'
};

const buttonStyle = {
  padding: '8px 16px',
  fontSize: '14px',
  backgroundColor: '#42b883',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

const todoStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px',
  marginBottom: '8px',
  backgroundColor: 'white',
  borderRadius: '4px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
};

const deleteButtonStyle = {
  marginLeft: 'auto',
  padding: '4px 8px',
  backgroundColor: '#ff4444',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};
</script>
