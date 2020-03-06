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

FriendlyEats.prototype.addUser = function (userId, data) {
  const userDoc = firebase.firestore().collection('users').doc(userId);
  return userDoc.set(data);
};

FriendlyEats.prototype.getUser = function (userId) {
  return firebase.firestore().collection('users').doc(userId).get();
};

FriendlyEats.prototype.addMeal = function (userId, data) {
  const mealsCollection = firebase.firestore()
  .collection('users').doc(userId)
  .collection('meals');
  return mealsCollection.add(data);
};

FriendlyEats.prototype.publishMeal = function(userId, mealId) {
  console.log("i thjink we're publishing this.")
  return firebase.firestore()
    .collection('users').doc(userId)
    .collection('meals').doc(mealId)
    .update({published:true})
    .catch(function(error) {
      console.log("Failed to publish meal: ", error);
    });
};


FriendlyEats.prototype.addFood = function (data) {
  const foodsCollection = firebase.firestore().collection('foods');
  return foodsCollection.add(data);
};

FriendlyEats.prototype.getAllPublishedMeals = function (render) {
  const query = firebase.firestore().collectionGroup('meals')
    .where('published', '==', true)
    .orderBy('date', 'desc');
  this.getDocumentsInQuery(query, render);
};

FriendlyEats.prototype.getAllMealsForUser = function (userId, render) {
  const query = firebase.firestore()
    .collection('users')
    .doc(userId)
    .collection('meals')
    .orderBy('date', 'desc')
    .limit(50);
  this.getDocumentsInQuery(query, render);
};

FriendlyEats.prototype.getDocumentsInQuery = function (query, render) {
  console.log(query);
  query.onSnapshot((snapshot) => {
  // TODO(pacoavila display something when there's no results a little more gracefully.
//    if (!snapshot.size) {
//      render();
//    }

    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' || change.type === 'modified') {
        render(change.doc);
      }
    });
  });
};

FriendlyEats.prototype.getMeal = function (userId, mealId) {
  return firebase.firestore().collection('users').doc(userId)
  .collection('meals').doc(mealId).get();
};

FriendlyEats.prototype.getFood = function (id) {
  return firebase.firestore().collection('foods').doc(id).get();
};

FriendlyEats.prototype.getFilteredMeals = function (filters, render) {

  // OK, so we need to start the query as a group if it's for any user.
  let query;
  if (filters.user !== 'Any') {
    query = firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid).collection('meals');
  } else {
    query = query.where('published', '==', true);
  }

  if (filters.category !== 'Any') {
    query = query.where('category', '==', filters.category);
  }

  if (filters.meal_type !== 'Any') {
    query = query.where('meal_type', '==', filters.meal_type);
  }

  if (filters.sort === 'Calories') {
    query = query.orderBy('nutritionFacts.calories', 'desc');
  } else if (filters.sort === 'Date') {
    query = query.orderBy('date', 'desc');
  }

  this.getDocumentsInQuery(query, render);
};

FriendlyEats.prototype.addIngredient = function(mealID, ingredientDocRef) {
  const collection = firebase.firestore()
  .collection('users').doc(firebase.auth().currentUser.uid)
  .collection('meals');
  const mealDoc = collection.doc(mealID);
  const ingredientDoc = mealDoc.collection('ingredients').doc();

  return firebase.firestore().runTransaction((transaction) => {
    return transaction.get(mealDoc).then((doc) => {
      const data = doc.data();

      var newNutritionFacts = data.nutritionFacts;
      var ingData = ingredientDocRef.data();
      const ingFacts = ingData.nutritionFacts;
      newNutritionFacts.calories += ingFacts.calories;
      newNutritionFacts.carbs += ingFacts.carbs;
      newNutritionFacts.protein += ingFacts.protein;
      newNutritionFacts.fat += ingFacts.fat;

      transaction.update(mealDoc, {
        nutritionFacts: newNutritionFacts,
      });
      return transaction.set(ingredientDoc, {
        food_id: ingredientDocRef.id,
        name: ingData.name,
        nutritionFacts: ingData.nutritionFacts,
      });
    })
  })
};