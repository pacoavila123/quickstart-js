/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

/**
 * Initializes the FriendlyEats app.
 */
function FriendlyEats() { // eslint-disable-line no-redeclare
  this.filters = {
    category: '',
    meal_type: '',
    users: 'Me',
    sort: 'Date'
  };

  this.dialogs = {};

  var that = this;

  firebase.firestore().enablePersistence({synchronizeTabs:true}).then(function() {
      var provider = new firebase.auth.GoogleAuthProvider();
      var user = firebase.auth().currentUser;
      if (user == null) {
        firebase.auth().signInWithRedirect(provider).then(function(result) {
          user = result.user;
        }).catch(function(error) {
          console.log("Failed to sign in user: ", error);
        });
      }
      return firebase.firestore().collection('users').doc(user.uid).get().then(function(doc) {
        if (!doc.exists) {
          that.addUser(user.uid, {
            name: user.displayName,
            email: user.email,
          });
        }
      }).catch(function(error) {
        console.log("error getting user:", error);
      });
    })
    .then(function() {
      that.initTemplates();
      that.initRouter();
      that.initReviewDialog();
      that.initFilterDialog();
    }).catch(function(err) {
      console.log(err);
    });
}

/**
 * Initializes the router for the FriendlyEats app.
 */
FriendlyEats.prototype.initRouter = function() {
  this.router = new Navigo();

  var that = this;
  this.router
    .on({
      '/': function() {
        that.updateQuery(that.filters);
      }
    })
    .on({
      '/meals/*': function() {
        var path = that.getCleanPath(document.location.pathname);
        var userId = path.split('/')[2];
        var id = path.split('/')[3];
        that.viewMeal(userId, id);
      }
    })
    .on({
      '/foods/*': function() {
        var path = that.getCleanPath(document.location.pathname);
        var id = path.split('/')[2];
        that.viewFood(id);
      }
    })
    .resolve();

  firebase
    .firestore()
    .collectionGroup('meals')
    .where('userId', '==', firebase.auth().currentUser.uid)
    .orderBy('date', 'desc')
    .onSnapshot(function(snapshot) {
      that.rerender();
    });
};

FriendlyEats.prototype.getCleanPath = function(dirtyPath) {
  if (dirtyPath.startsWith('/index.html')) {
    return dirtyPath.split('/').slice(1).join('/');
  } else {
    return dirtyPath;
  }
};

FriendlyEats.prototype.getFirebaseConfig = function() {
  return firebase.app().options;
};

FriendlyEats.prototype.getRandomItem = function(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
};


window.onload = function() {
  window.app = new FriendlyEats();
};
