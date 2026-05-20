# Stampy app

## Overview 
A cute app that allows you to take photos, and convert them to stamps. You can then class them and organize them by theme and date.

## Tech stack
- Mobile only
- Will need access to the camera and local storage

## Project structure


## Code guidelines
- Make sure to comment the code, so I can check it, and learn from it. Comment the code to explain what the block does, and what is the intention and the logic.


## Core features and requirements
- Main menu : Will be placed at the bottom, and will feature 4 options
	- Create Stamp : Create a new stamp, using the camera
	- Library : See your stamp collection
	- Calendar : See a calendar, and the stamp of the day
	- Flow : See a display of all your stamps, but instead of being a list, they are individually placed on the screen in a messay, but chronologically way.

- Create stamp : You allow access to the camera. On the screen is the camera view, with a stamp outline on it. When the user take a picture, only the part in the stamp outline will be saved. 
	- Take photo : With a button located at the bottom, teh user can push it to create a stamp from the outline on the screen. 
		- Once a photo was taken it will then prompt the user to save the stamp, by giving it a name, a note, and allowing it to place it in a category.
		- A smooth animation will "remove" the stamp from the outline, the next screen will slide from teh right, and the stamp will be placed on the new screen.
		- The name will be pre-filled with the today's date and hour.
	- Change format : The user can take a stamp in a vertical, square, or portrait outline. Pressing the "format" button will cycle between the 3 formats. The button is smaller and located left of the "take photo" button.
	
- Calendar : Every first stamp of the day will be placed on a virtual calendar. If you create a stamp, it will be automatically placed on today's calendar slot if there's isn't already one. By selecting the date, you can change to a stamp of your choice.
	- Each stamp of the day will be placed on the day's slot in a irregular way. The stamps would be displayed with a random rotation of +10° or -10°, to give a patchwork and DIY feeling.
	

- Library : All the stamps the user ever created, ordered either by date, or by category. By selecting a stamp, you will focus on it.
	- Stamp view : Touching a stamp will focus on it. When focused on the stamp, the user can edit it's informations, like the name or the category. The stamp will be the focus of the screen.
		- Edit : When focused on a stamp. There will be the stamp informations displayed below. The user can touch the informations to change the name, the note or the category.
		- Category : When focused on a stamp, the user can switch the stamp category by pressing on it. A dropdown will appear.
		- Delete : There will be a small trash icon at the bottom of the stamp view. Pressing it will promp the user to confirm if the stamp will be deleted. If no, nothing happens, and the user go back to the previous view. If yes, the stamp is deleted, and the user go back to the previous view.
	- Category : Inside the library, you can switch from "Stamp" view to "Category" view. Here, you can sort stamp by category, displayed in a list.
		- Pressing a category will display all the stamps of that category, displayed in a grid-like way like in the Library page.
			- When a category is selected, the user can go back to the category listing by pressing a "back" button at the top-left.
		- Add : Inside the category view : You can create a new category by pressing a "+" button.
		- Edit : Inside the category view : You can switch to edit mode by pressing a "Edit" button, next to the add button.
			- Edit mode : You can change the name of each category my pressing it in the list, then teh virtual keyboard will appear to change the name. It is also possible to delete each category by pressing a trash icon in the list, in edit mode. It will ask for a confirmation, and, if confired, will delete the category, but not the stamps associated in that category.
		
- Calendar : See a view of the current month in a calendar form. Each day has a zone that can be empty, or can be placed a miniature version of a stamp. 
	- Navigation : You can select previous months at the top through an arrow, or search by using a date selector.
	- View : Pressing a day with a stamp will display the stamp and its associated informations. Selecting an empty day will prompt the user in selecting a stamp to place on that day by selecting it from the library.
		- If pressing an empty day, the user will be taken to the full library screen.
		- If the user touch a stamp, it will outline and select the stamp.
		- When a stamp is selected, the user can place it on the day previously selected by pressing a checkmark button at the top-right of the screen.
		- The user can go back by pressing a "Back" button at the top-left of the screen.
		- Only one stamp can be selected at a time.
	- You cannot edit or select days in the future.
	
-Flow : While in the library each stampo is placed on a grid, in a organised fashion, the flow display will display the stamps in a messy, but chronological way. 
	- Each stamp might be placed on top of another, but not fully to hide it.
	- Stamps will be placed with random rotation parameter.
	
	
- Settings : A "Setting" menu will be accessible from the "Library" page, at the top left.
	- Once accessing the settings menu, the user can go back by pressing a "Back" button at the top-left.


- Stamp : A stamp is defined like so, it is associated with : 
	- A picture. Cannot be changed.
	- A name in text. Can be changed.
	- A note in text with a maximum of 500 characters. Can be changed.
	- A date, the date it was taken, cannot be changed.
	- A category, can be changed.