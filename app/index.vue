<script lang="ts" setup>
const route = useRoute();
const boxesStore = useBoxesStore();

const isEdit = !!route.query.edit;
</script>

<template>
  <div class="app">
    <frame-boxes
        :is-edit="isEdit"
        v-model="boxesStore"
    />
    <frame-results
        :is-edit="isEdit"
        v-model="boxesStore"
    />
  </div>
</template>


<style lang="scss" scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.boxes {
  flex-grow: 1;
}
</style>
