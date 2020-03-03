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

FriendlyEats.prototype.addMeal = function (data) {
  const collection = firebase.firestore().collection('meals');
  return collection.add(data);
};

FriendlyEats.prototype.addFood = function (data) {
  const collection = firebase.firestore().collection('foods');
  return collection.add(data);
}

FriendlyEats.prototype.getAllMeals = function (render) {
  const query = firebase.firestore()
    .collection('meals')
    .orderBy('date', 'desc')
    .limit(50);
  this.getDocumentsInQuery(query, render);
};

FriendlyEats.prototype.getDocumentsInQuery = function (query, render) {
  query.onSnapshot((snapshot) => {
    if (!snapshot.size) {
      return render();
    }

    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' || change.type === 'modified') {
        render(change.doc);
      }
    });
  });
};

FriendlyEats.prototype.getMeal = function (id) {
  return firebase.firestore().collection('meals').doc(id).get();
};

FriendlyEats.prototype.getFilteredMeals = function (filters, render) {
  let query = firebase.firestore().collection('meals');

  if (filters.category !== 'Any') {
    query = query.where('category', '==', filters.category);
  }

  if (filters.sort === 'Calories') {
    query = query.orderBy('nutritionFacts.calories', 'desc');
  } else if (filters.sort === 'Date') {
    query = query.orderBy('date', 'desc');
  }

  this.getDocumentsInQuery(query, render);
};

FriendlyEats.prototype.addIngredient = function(mealID, ingredientDocRef) {
  const collection = firebase.firestore().collection('meals');
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
      console.log(ingredientDocRef);
      return transaction.set(ingredientDoc, {
        ingredient_id: ingredientDocRef.id,
        name: ingData.name,
        nutritionFacts: ingData.nutritionFacts,
      });
    })
  })
}

FriendlyEats.prototype.addRating = function (mealID, rating) {
  const collection = firebase.firestore().collection('meals');
  const document = collection.doc(mealID);
  const newRatingDocument = document.collection('ratings').doc();

  return firebase.firestore().runTransaction((transaction) => {
    return transaction.get(document).then((doc) => {
      const data = doc.data();

      const newAverage =
          (data.numRating * data.avgRating + rating.rating) /
          (data.numRating + 1);

      transaction.update(document, {
        numRating: data.numRating + 1,
        avgRating: newAverage
      });
      return transaction.set(newRatingDocument, rating);
    });
  });
};
