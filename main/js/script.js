console.log("Trang chủ nitro.com loaded");

const firebaseConfig = {
  apiKey: "AIzaSyAz_ck88CPTERdVZgjWvJm7MCMBbMlyq_Y",
  authDomain: "nitro-website-5b791.firebaseapp.com",
  projectId: "nitro-website-5b791",
  storageBucket: "nitro-website-5b791.firebasestorage.app",
  messagingSenderId: "994553595303",
  appId: "1:994553595303:web:ba1988b21ffc0f13366282",
  measurementId: "G-8HVN0SYC7C"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const analytics = getAnalytics(app);

// Handle Authentication State
auth.onAuthStateChanged((user) => {
  const userInfo = document.getElementById('user-info');
  const signOutBtn = document.getElementById('sign-out-btn');
  const createPostBtn = document.getElementById('create-post-btn');
  const authSection = document.getElementById('auth-section');

  if (user) {
    // User signed in
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
    // No user signed in
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
document.getElementById('sign-in-btn')?.addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('error-message');

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = '/nitro-website/account';
    })
    .catch((error) => {
      errorMessage.classList.remove('hidden');
      errorMessage.textContent = `Lỗi đăng nhập: ${error.message}`;
    });
});

// Sign out
document.getElementById('sign-out-btn')?.addEventListener('click', () => {
  auth.signOut()
    .then(() => {
      window.location.href = '/nitro-website/login';
    })
    .catch((error) => {
      alert("Lỗi đăng xuất: " + error.message);
    });
});

// Create or update post
document.getElementById('create-post-btn')?.addEventListener('click', () => {
  const title = document.getElementById('post-title')?.value;
  const description = document.getElementById('post-description')?.value;
  const coverImage = document.getElementById('post-cover')?.value;
  const slug = document.getElementById('post-slug')?.value;
  const content = document.getElementById('post-content')?.value;
  const errorMessage = document.getElementById('error-message');
  const user = auth.currentUser;

  if (!title || !description || !slug || !content) {
    errorMessage.classList.remove('hidden');
    errorMessage.textContent = 'Vui lòng nhập đầy đủ thông tin!';
    return;
  }

  db.collection('posts').doc(slug).set({
    title,
    description,
    coverImage,
    slug,
    content,
    author: user.email,
    uid: user.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    alert("Bài viết đã được tạo/cập nhật!");
    localStorage.removeItem('editPost');
    window.location.href = '/nitro-website/account';
  })
  .catch((error) => {
    errorMessage.classList.remove('hidden');
    errorMessage.textContent = `Lỗi khi lưu bài viết: ${error.message}`;
  });
});

// Load all posts (for articles.html)
function loadPosts() {
  const postsList = document.getElementById('posts-list');
  if (!postsList) return;

  postsList.innerHTML = 'Đang tải bài viết...';

  db.collection('posts').orderBy('createdAt', 'desc').get()
    .then((querySnapshot) => {
      postsList.innerHTML = '';
      querySnapshot.forEach((doc) => {
        const post = doc.data();
        const postElement = document.createElement('div');
        postElement.className = 'bg-white p-4 rounded shadow';
        postElement.innerHTML = `
          <h3 class="text-xl font-bold"><a href="/nitro-website/articles/${post.slug}" class="text-blue-600 hover:underline">${post.title}</a></h3>
          <p class="text-gray-700">${post.description}</p>
          <p class="text-sm text-gray-500">Tác giả: ${post.author}</p>
        `;
        postsList.appendChild(postElement);
      });
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

  db.collection('posts').doc(slug).get()
    .then((doc) => {
      if (doc.exists) {
        const post = doc.data();
        postDetail.innerHTML = `
          <h2 class="text-2xl font-bold mb-4">${post.title}</h2>
          ${post.coverImage ? `<img src="${post.coverImage}" alt="${post.title}" class="w-full h-64 object-cover mb-4 rounded">` : ''}
          <p class="text-gray-700 mb-4">${post.description}</p>
          <p class="text-gray-700">${post.content}</p>
          <p class="text-sm text-gray-500 mt-4">Tác giả: ${post.author}</p>
        `;
      } else {
        postDetail.innerHTML = 'Bài viết không tồn tại.';
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

  db.collection('posts').where('uid', '==', uid).orderBy('createdAt', 'desc').get()
    .then((querySnapshot) => {
      userPostsList.innerHTML = '';
      querySnapshot.forEach((doc) => {
        const post = doc.data();
        const postElement = document.createElement('div');
        postElement.className = 'bg-white p-4 rounded shadow flex justify-between items-center';
        postElement.innerHTML = `
          <div>
            <h3 class="text-xl font-bold"><a href="/nitro-website/articles/${post.slug}" class="text-blue-600 hover:underline">${post.title}</a></h3>
            <p class="text-gray-700">${post.description}</p>
          </div>
          <div>
            <button onclick="editPost('${post.slug}')" class="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Chỉnh sửa</button>
            <button onclick="deletePost('${post.slug}')" class="bg-red-500 text-white px-3 py-1 rounded">Xóa</button>
          </div>
        `;
        userPostsList.appendChild(postElement);
      });
    })
    .catch((error) => {
      userPostsList.innerHTML = 'Lỗi khi tải bài viết.';
      console.error("Error loading posts:", error);
    });
}

// Edit post (redirect to create-post with pre-filled data)
function editPost(slug) {
  db.collection('posts').doc(slug).get()
    .then((doc) => {
      if (doc.exists) {
        const post = doc.data();
        localStorage.setItem('editPost', JSON.stringify({ ...post, slug }));
        window.location.href = '/nitro-website/create-post';
      }
    })
    .catch((error) => {
      alert("Lỗi khi tải bài viết: " + error.message);
    });
}

// Delete post
function deletePost(slug) {
  if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
    db.collection('posts').doc(slug).delete()
      .then(() => {
        alert("Bài viết đã được xóa!");
        loadUserPosts(auth.currentUser.uid);
      })
      .catch((error) => {
        alert("Lỗi khi xóa bài viết: " + error.message);
      });
}

// Pre-fill form for editing
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('/create-post')) {
    const editPost = JSON.parse(localStorage.getItem('editPost'));
    if (editPost) {
      document.getElementById('post-title').value = editPost.title;
      document.getElementById('post-description').value = editPost.description;
      document.getElementById('post-cover').value = editPost.coverImage || '';
      document.getElementById('post-slug').value = editPost.slug;
      document.getElementById('post-content').value = editPost.content;
    }
  }
  if (window.location.pathname.includes('/articles') && !window.location.pathname.includes('/articles/')) {
    loadPosts();
  } else if (window.location.pathname.includes('/articles/')) {
    loadPostDetail();
  }
});