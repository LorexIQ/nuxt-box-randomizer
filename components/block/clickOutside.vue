<script setup lang="ts">
interface Props {
  state?: boolean;
  throttle?: number;
}
interface Emits {
  (e: 'trigger', value: Event): void;
}

const props = withDefaults(defineProps<Props>(), {
  state: true,
  throttle: 0
});
const emit = defineEmits<Emits>();

onMounted(() => props.state && addEvent());
onUnmounted(() => removeEvent());

watch(() => props.state, (value) => {
  if (value) addEvent();
  else removeEvent();
});

function addEvent() {
  setTimeout(() => {
    document.addEventListener('click', onClick);
  }, props.throttle);
}
function removeEvent() {
  document.removeEventListener('click', onClick);
}
function onClick(event: Event) {
  emit('trigger', event);
}
</script>

<template>
  <div
      class="click-outside-block"
      @click.stop
  >
    <slot/>
  </div>
</template>
