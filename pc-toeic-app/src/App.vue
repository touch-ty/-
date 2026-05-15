<template>
  <div class="app-wrapper">
    <el-container class="main-container">
      <el-aside width="200px" class="glass-sidebar">
        <div class="logo">TOEIC Master</div>
        <el-menu 
          router 
          :default-active="$route.path"
          background-color="transparent" 
          text-color="#fff" 
          active-text-color="#ffd04b"
        >
          <el-menu-item index="/">
            <span>学习 Learn</span>
          </el-menu-item>
          <el-menu-item index="/paper">
            <span>论文 Paper</span>
          </el-menu-item>
          <el-menu-item index="/forum">
            <span>论坛 Forum</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-main>
        <div class="glass-content">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
.app-wrapper {
  height: 100vh;
  width: 100vw;
  background-image: url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b'); 
  background-size: cover;
  background-position: center;
}

.main-container {
  height: 100%;
}

.glass-sidebar {
  background: rgba(20, 20, 20, 0.4);
  backdrop-filter: blur(15px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
}

.logo {
  color: white;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}

.glass-content {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  height: calc(100% - 80px);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
</style>