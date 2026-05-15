<template>
  <div class="paper-page">
    <h1>Paper Management</h1>
    
    <div class="card-container">
      <div class="glass-card clickable" @click="$router.push('/quiz')">Learn: 3576</div>
      <div class="glass-card clickable" @click="$router.push('/quiz')">Review: 192</div>
    </div>

    <div class="upload-section">
      <el-upload
        class="paper-uploader"
        drag
        action="#"
        :auto-upload="false"
        multiple
        :on-change="handleFileChange"
        accept=".pdf,.doc,.docx,image/*"
      >
        <div class="upload-content">
          <div class="upload-button-wrapper">
            <button class="blue-upload-btn">上传论文</button>
          </div>
          <div class="el-upload__text">
            或者拖放一个文件，
          </div>
          <div class="upload-hint">
            支持 PDF, Word 或 图片格式
          </div>
        </div>
      </el-upload>
    </div>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'

const handleFileChange = (file) => {
  const fileName = file.name;
  const fileExt = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
  const isAllowed = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'].includes(fileExt);
  
  if (isAllowed) {
    ElMessage.success(`文件 ${fileName} 已准备好上传`);
  } else {
    ElMessage.error('不支持该格式，请上传 PDF, Word 或图片');
  }
}
</script>

<style scoped>
.paper-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-container {
  display: flex;
  gap: 20px;
  margin-top: 30px;
}

.glass-card {
  flex: 1;
  padding: 30px;
  background: rgba(0, 0, 0, 0.3); 
  border-radius: 12px;
  font-size: 28px; 
  font-weight: 600; 
  font-family: 'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif; 
  letter-spacing: 1.5px; 
  color: #ffffff; 
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6); 
  display: flex;
  align-items: center;
}

.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}
.clickable:hover {
  transform: translateY(-5px); 
  background: rgba(0, 0, 0, 0.4); 
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}
.clickable:active {
  transform: scale(0.98); 
}

.upload-section {
  margin-top: 50px;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

:deep(.el-upload-dragger) {
  width: 600px;
  height: 350px;
  background: rgba(255, 255, 255, 0.2); 
  backdrop-filter: blur(10px);
  border: 2px dashed rgba(255, 255, 255, 0.4);
  border-radius: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s;
}
:deep(.el-upload-dragger:hover) {
  border-color: #409eff;
  background: rgba(255, 255, 255, 0.3);
}
.upload-content {
  text-align: center;
}
.upload-button-wrapper {
  margin-bottom: 25px;
}
.blue-upload-btn {
  background-color: #0066ff;
  color: white;
  border: none;
  padding: 12px 40px;
  border-radius: 25px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 102, 255, 0.3);
  transition: transform 0.2s;
}
.blue-upload-btn:hover {
  transform: scale(1.05);
  background-color: #0052cc;
}
.el-upload__text {
  font-size: 24px;
  color: #000000; 
  font-weight: 500;
}
.upload-hint {
  margin-top: 10px;
  font-size: 14px;
  color: #333333;
}
</style>