import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp, deleteDoc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("Trang chủ nitro.com loaded - DOM ready");

  const firebaseConfig = {
    apiKey: "AIzaSyAz_ck88CPTERdVZgjWvJm7MCMBbMlyq_Y",
    authDomain: "nitro-website-5b791.firebaseapp.com",
    projectId: "nitro-website-5b791",
    storageBucket: "nitro-website-5b791.firebasestorage.app",
    messagingSenderId: "994553595303",
    appId: "1:994553595303:web:ba1988b21ffc0f13366282",
  };

  // Initialize Firebase
  let app, auth, db;
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully:", app.name);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    alert("Lỗi khởi tạo Firebase: " + error.message);
    return;
  }

  // Handle Authentication State
  onAuthStateChanged(auth, (user) => {
    console.log("Auth state changed:", user ? user.email : "No user");
    const userInfo = document.getElementById('user-info');
    const signOutBtn = document.getElementById('sign-out-btn');
    const createPostBtn = document.getElementById('create-post-btn');
    const authSection = document.getElementById('auth-section');

    if (user) {
      if (userInfo) userInfo.textContent = `Xin chào, ${user.email}`;
      if (signOutBtn) signOutBtn.classList.remove('hidden');
      if (createPostBtn) createPostBtn.classList.remove('hidden');
      if (authSection && window.location.pathname.includes('/create-post')) {
        authSection.classList.remove('hidden');
      }
      if (window.location.pathname.includes('/account')) {
        loadUserPosts(user.uid);
      }
    } else {
      if (userInfo) userInfo.textContent = 'Vui lòng đăng nhập để tiếp tục';
      if (signOutBtn) signOutBtn.classList.add('hidden');
      if (createPostBtn) createPostBtn.classList.add('hidden');
      if (authSection && window.location.pathname.includes('/create-post')) {
        window.location.href = '/nitro-website/login';
      }
      if (window.location.pathname.includes('/account')) {
        window.location.href = '/nitro-website/login';
      }
    }
  });

  // Sign in with Email/Password
  const signInBtn = document.getElementById('sign-in-btn');
  if (signInBtn) {
    console.log("Sign-in button found, attaching event listener");
    signInBtn.addEventListener('click', () => {
      console.log("Sign-in button clicked");
      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value.trim();
      const errorMessage = document.getElementById('error-message');

      if (!email || !password) {
        if (errorMessage) {
          errorMessage.classList.remove('hidden');
          errorMessage.textContent = 'Vui lòng nhập email và mật khẩu!';
        }
        console.log("Missing or empty email/password");
        return;
      }

      console.log("Attempting sign-in with email:", email);
      if (!auth) {
        console.error("Auth not initialized");
        if (errorMessage) {
          errorMessage.classList.remove('hidden');
          errorMessage.textContent = 'Lỗi: Firebase Authentication chưa khởi tạo.';
        }
        return;
      }

      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          console.log("Sign-in successful:", userCredential.user.email);
          window.location.href = '/nitro-website/account';
        })
        .catch((error) => {
          console.error("Sign-in failed:", error.code, error.message);
          if (errorMessage) {
            errorMessage.classList.remove('hidden');
            let message = 'Lỗi đăng nhập: ';
            switch (error.code) {
              case 'auth/invalid-email':
                message += 'Email không hợp lệ.';
                break;
              case 'auth/user-not-found':
                message += 'Tài khoản không tồn tại.';
                break;
              case 'auth/wrong-password':
                message += 'Mật khẩu sai.';
                break;
              case 'auth/invalid-credential':
                message += 'Thông tin đăng nhập không hợp lệ.';
                break;
              case 'auth/operation-not-allowed':
                message += 'Phương thức đăng nhập không được bật.';
                break;
              default:
                message += error.message;
            }
            errorMessage.textContent = message;
          }
        });
    });
  } else {
    console.warn("Sign-in button not found in DOM");
  }

  // Sign out
  const signOutBtn = document.getElementById('sign-out-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      console.log("Attempting sign-out");
      if (auth) {
        signOut(auth)
          .then(() => {
            console.log("Sign-out successful");
            window.location.href = '/nitro-website/login';
          })
          .catch((error) => {
            console.error("Sign-out failed:", error);
            alert("Lỗi đăng xuất: " + error.message);
          });
      } else {
        console.error("Auth not initialized for sign-out");
      }
    });
  }

  // Create or update post
  const createPostBtn = document.getElementById('create-post-btn');
  if (createPostBtn) {
    createPostBtn.addEventListener('click', () => {
      console.log("Create post button clicked");
      const title = document.getElementById('post-title')?.value.trim();
      const description = document.getElementById('post-description')?.value.trim();
      const coverImage = document.getElementById('post-cover')?.value.trim();
      const slug = document.getElementById('post-slug')?.value.trim();
      const content = document.getElementById('post-content')?.value.trim();
      const errorMessage = document.getElementById('error-message');
      const user = auth.currentUser;

      if (!title || !description || !slug || !content) {
        if (errorMessage) {
          errorMessage.classList.remove('hidden');
          errorMessage.textContent = 'Vui lòng nhập đầy đủ thông tin!';
        }
        console.log("Missing post fields");
        return;
      }

      if (!user) {
        if (errorMessage) {
          errorMessage.classList.remove('hidden');
          errorMessage.textContent = 'Vui lòng đăng nhập để tạo bài viết!';
        }
        console.log("User not authenticated");
        return;
      }

      console.log("Creating/updating post with slug:", slug);
      setDoc(doc(db, 'posts', slug), {
        title,
        description,
        coverImage,
        slug,
        content,
        author: user.email,
        uid: user.uid,
        createdAt: serverTimestamp()
      })
      .then(() => {
        console.log("Post created/updated successfully");
        alert("Bài viết đã được tạo/cập nhật!");
        localStorage.removeItem('editPost');
        window.location.href = '/nitro-website/account';
      })
      .catch((error) => {
        console.error("Post creation failed:", error);
        if (errorMessage) {
          errorMessage.classList.remove('hidden');
          errorMessage.textContent = `Lỗi khi lưu bài viết: ${error.message}`;
        }
      });
    });
  }

  // Load all posts (for articles.html)
  function loadPosts() {
    const postsList = document.getElementById('posts-list');
    if (!postsList) return;

    postsList.innerHTML = 'Đang tải bài viết...';
    console.log("Loading all posts");

    getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')))
      .then((querySnapshot) => {
        postsList.innerHTML = '';
        if (querySnapshot.empty) {
          postsList.innerHTML = '<p class="text-center text-gray-500">Chưa có bài viết nào.</p>';
          return;
        }
        querySnapshot.forEach((doc) => {
          const post = doc.data();
          const postElement = document.createElement('div');
          postElement.className = 'bg-white p-4 rounded shadow mb-4';
          postElement.innerHTML = `
            <h3 class="text-xl font-bold mb-2">
              <a href="/nitro-website/articles/${post.slug}" class="text-blue-600 hover:underline">${post.title}</a>
            </h3>
            <p class="text-gray-700 mb-2">${post.description}</p>
            <p class="text-sm text-gray-500">Tác giả: ${post.author}</p>
          `;
          postsList.appendChild(postElement);
        });
        console.log("Posts loaded successfully");
      })
      .catch((error) => {
        postsList.innerHTML = 'Lỗi khi tải bài viết.';
        console.error("Error loading posts:", error);
      });
  }

  // Load post detail (for article-detail.html)
  function loadPostDetail() {
    const postDetail = document.getElementById('post-detail');
    if (!postDetail) return;

    const slug = window.location.pathname.split('/').pop();
    if (!slug) {
      postDetail.innerHTML = 'Bài viết không tồn tại.';
      return;
    }

    console.log("Loading post detail for slug:", slug);
    getDoc(doc(db, 'posts', slug))
      .then((docSnap) => {
        if (docSnap.exists()) {
          const post = docSnap.data();
          postDetail.innerHTML = `
            <div class="bg-white p-4 rounded shadow">
              <h2 class="text-2xl font-bold mb-4">${post.title}</h2>
              ${post.coverImage ? `<img src="${post.coverImage}" alt="${post.title}" class="w-full h-64 object-cover mb-4 rounded">` : ''}
              <p class="text-gray-700 mb-4">${post.description}</p>
              <div class="prose max-w-none">${post.content}</div>
              <p class="text-sm text-gray-500 mt-4">Tác giả: ${post.author}</p>
            </div>
          `;
          console.log("Post detail loaded successfully");
        } else {
          postDetail.innerHTML = 'Bài viết không tồn tại.';
          console.log("Post not found for slug:", slug);
        }
      })
      .catch((error) => {
        postDetail.innerHTML = 'Lỗi khi tải bài viết.';
        console.error("Error loading post:", error);
      });
  }

  // Load user posts (for account.html)
  function loadUserPosts(uid) {
    const userPostsList = document.getElementById('user-posts-list');
    if (!userPostsList) return;

    userPostsList.innerHTML = 'Đang tải bài viết của bạn...';
    console.log("Loading user posts for UID:", uid);

    getDocs(query(collection(db, 'posts'), where('uid', '==', uid), orderBy('createdAt', 'desc')))
      .then((querySnapshot) => {
        userPostsList.innerHTML = '';
        if (querySnapshot.empty) {
          userPostsList.innerHTML = '<p class="text-center text-gray-500">Bạn chưa có bài viết nào.</p>';
          return;
        }
        querySnapshot.forEach((doc) => {
          const post = doc.data();
          const postElement = document.createElement('div');
          postElement.className = 'bg-white p-4 rounded shadow flex justify-between items-center mb-4';
          postElement.innerHTML = `
            <div>
              <h3 class="text-xl font-bold mb-2">
                <a href="/nitro-website/articles/${post.slug}" class="text-blue-600 hover:underline">${post.title}</a>
              </h3>
              <p class="text-gray-700">${post.description}</p>
            </div>
            <div>
              <button onclick="editPost('${post.slug}')" class="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Chỉnh sửa</button>
              <button onclick="deletePost('${post.slug}')" class="bg-red-500 text-white px-3 py-1 rounded">Xóa</button>
            </div>
          `;
          userPostsList.appendChild(postElement);
        });
        console.log("User posts loaded successfully");
      })
      .catch((error) => {
        userPostsList.innerHTML = 'Lỗi khi tải bài viết.';
        console.error("Error loading user posts:", error);
      });
  }

  // Edit post (redirect to create-post with pre-filled data)
  window.editPost = function(slug) {
    console.log("Editing post with slug:", slug);
    getDoc(doc(db, 'posts', slug))
      .then((docSnap) => {
        if (docSnap.exists()) {
          const post = docSnap.data();
          localStorage.setItem('editPost', JSON.stringify({ ...post, slug }));
          window.location.href = '/nitro-website/create-post';
          console.log("Post data loaded for editing");
        }
      })
      .catch((error) => {
        console.error("Error loading post for edit:", error);
        alert("Lỗi khi tải bài viết: " + error.message);
      });
  };

  // Delete post
  window.deletePost = function(slug) {
    if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
      console.log("Deleting post with slug:", slug);
      deleteDoc(doc(db, 'posts', slug))
        .then(() => {
          console.log("Post deleted successfully");
          alert("Bài viết đã được xóa!");
          loadUserPosts(auth.currentUser.uid);
        })
        .catch((error) => {
          console.error("Error deleting post:", error);
          alert("Lỗi khi xóa bài viết: " + error.message);
        });
    }
  };

  // Pre-fill form for editing
  if (window.location.pathname.includes('/create-post')) {
    const editPost = JSON.parse(localStorage.getItem('editPost'));
    if (editPost) {
      document.getElementById('post-title').value = editPost.title;
      document.getElementById('post-description').value = editPost.description;
      document.getElementById('post-cover').value = editPost.coverImage || '';
      document.getElementById('post-slug').value = editPost.slug;
      document.getElementById('post-content').value = editPost.content;
      console.log("Pre-filled edit form for slug:", editPost.slug);
    }
  }

  if (window.location.pathname.includes('/articles') && !window.location.pathname.includes('/articles/')) {
    loadPosts();
  } else if (window.location.pathname.includes('/articles/')) {
    loadPostDetail();
  }
});