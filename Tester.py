import tkinter as tk
import random
import math
import time

class GUI:
    # class Setup:
    #     def __init__(self) -> None:
    #         self.root = tk.Tk()


    #         self.setup()

    #         self.root.mainloop()

    #     def getAndValidate(self, inpt):
    #         out = int("0" + "".join([n for n in inpt.get() if n.isnumeric()]))
    #         inpt.set(out)
    #         return out
                            
    #     def setup(self):

            

    #         frame = tk.Frame(self.root)
    #         self.repeats_input = tk.StringVar(value=10)

    #         self.repeats_input.trace_add("write", lambda *e: self.getAndValidate(self.repeats_input))

    #         tk.Label(frame, state=tk.DISABLED, text="Počet opakovaní", font=(None, 11), anchor=tk.W, justify=tk.LEFT) \
    #             .pack(fill=tk.BOTH, side=tk.LEFT, padx=3)

    #         tk.Entry(frame, textvariable=self.repeats_input, width=50) \
    #             .pack(side=tk.LEFT, padx=3, fill=tk.BOTH)
    #         frame.pack(fill=tk.X, pady=(0, 5))

    #         mb = tk.Menubutton(self.root, text="Akceptované tvary", relief=tk.RAISED)
    #         mb.pack(fill=tk.X)

    #         mb.menu = tk.Menu(mb)
    #         mb["menu"] = mb.menu

    #         self.shapes_input = {}
    #         for shape in Shapes.getShapes():
    #             name = shape.getName()
    #             var = tk.IntVar()
    #             mb.menu.add_checkbutton(label=name, variable=var)
    #             self.shapes_input[name] = var

    class Tester:
        def __init__(self) -> None:
            self.root = tk.Tk()

            self.CWIDTH = 1000
            self.CHEIGHT = 1000
            self.OFFSET = 150

            self.count = 10
            self.allowed_shapes = ["Square"]

            self.setup()
            self.root.mainloop()

        def setup(self):
            self.topbar = tk.Frame(self.root, background="yellow")
            self.topbar.pack(side=tk.TOP, fill=tk.X)
            tk.Button(self.topbar, text="Reset" ,command=lambda *_: self.root.destroy()) \
                .pack(padx=3, side=tk.LEFT, fill=tk.Y)

            self.stats = tk.Label(self.topbar, text="", font=(12, 12))
            self.stats.pack(side=tk.TOP, fill=tk.Y)

            self.canvas = tk.Canvas(self.root, width=self.CWIDTH, height=self.CHEIGHT)
            self.canvas.pack()

            self.canvas.create_text(self.CWIDTH//2, self.CHEIGHT//2, text="Začnite stlačením medzerníka\nalebo tlačidla myši", font=(40, 40), justify=tk.CENTER)
            self.root.bind("<space>", lambda *_: self.start())
            self.root.bind("<Button-1>", lambda *_: self.start())

        def start(self):
            self.root.unbind("<space>")
            self.root.unbind("<Button-1>")
            self.clear()

            self.score = [0, 0, 0]
            self.times = []
            self.stats.configure(text=self.getStats())

            self.root.bind("<space>", lambda *_: self.validate())
            self.root.bind("<Button-1>", lambda *_: self.validate())
            self.root.after(2000, lambda *_: self.draw())

        def draw(self):
            self.shape = random.choice(Shapes.getShapes())
            self.shape.draw(self.canvas, 
                            random.randint(self.OFFSET, self.CWIDTH - self.OFFSET), 
                            random.randint(self.OFFSET, self.CHEIGHT - self.OFFSET), 
                            random.randint(100, 250))

            self.count -= 1

            self.time = time.time_ns()

            display_time = random.randint(500, 1000)
            empty_time = random.randint(display_time, 2500)

            self.canvas.after(display_time, lambda *_: self.clear())
            if self.count > 0:
                self.root.after(empty_time, lambda *_: self.draw())
            else:
                self.root.after(display_time + 500, lambda *_: self.end())

        def end(self):
            self.root.unbind("<space>")
            self.root.unbind("<Button-1>")

            self.canvas.create_text(self.CWIDTH//2, self.CHEIGHT//2,
                                    text=f"Koniec\n\n{self.getStats().replace(' | ', '|')}", font=(40, 40), justify=tk.CENTER)

        def clear(self):
            self.canvas.delete("all")
            self.time = None
            self.shape = None

        def validate(self):
            if not (self.time and self.shape):
                self.score[2] += 1
            else:
                if self.shape.getName() not in self.allowed_shapes:
                    self.score[1] += 1
                else:
                    self.score[0] += 1
                    self.times.append(time.time_ns() - self.time)
                    self.clear()
            self.stats.configure(text=self.getStats())
        
        def getStats(self):
            score = ' / '.join(map(str, self.score))
            average_time = round(sum(self.times) / len(self.times) / 1000000, 2) if self.times else 0
            precision = round(self.score[0] / sum(self.score) * 100, 1) if sum(self.score) else 0
            return f"Dobré / Zlé / Mimo : {score} | Priemerný čas {average_time} ms | Presnosť {precision} %"

class Shapes:
    @staticmethod
    def getShapes():
        return [
            Shapes.Rectangle(),
            Shapes.Square(),
            Shapes.Circle(),
            Shapes.Triangle()
        ]

    class Shape:
        def __getPoints__(self, x, y, scale):
            return []

        def rotate(self, points, angle, origin_x, origin_y):
            new_points = list(points)
            rad = angle * (math.pi/180)
            cos_val = math.cos(rad)
            sin_val = math.sin(rad)
            for coords in new_points:
                x_val =  coords[0] - origin_x
                y_val = coords[1] - origin_y
                coords[0] = x_val * cos_val - y_val * sin_val + origin_x
                coords[1] = x_val * sin_val + y_val * cos_val + origin_y
            return new_points

        def getName(self):
            return None
        
        def draw(self, canvas, x, y, scale):
            points = self.rotate(self.__getPoints__(x, y, scale), random.randint(0, 180), x, y)
            return canvas.create_polygon(points, fill="Black")


    class Square(Shape):
        def getName(self):
            return "Square"

        def __getPoints__(self, x, y, scale):
            return [
                [x-scale, y-scale], 
                [x-scale, y+scale], 
                [x+scale, y+scale],
                [x+scale, y-scale]
            ]
        
    class Rectangle(Shape):
        def getName(self):
            return "Rectangle"

        def __getPoints__(self, x, y, scale):
            return [
                [x-scale, y-(scale//2)], 
                [x-scale, y+(scale//2)], 
                [x+scale, y+(scale//2)],
                [x+scale, y-(scale//2)]
            ]

    class Triangle(Shape):
        def getName(self):
            return "Triangle"

        def __getPoints__(self, x, y, scale):
            return [
                [x-scale, y-(scale//2)], 
                [x-scale, y+(scale//2)], 
                [x+scale, y+(scale//2)],
            ]
        
    class Circle(Shape):
        def getName(self):
            return "Circle"
        
        def draw(self, canvas, x, y, scale):
            return canvas.create_oval(x-scale, y-scale, x+scale, y+scale, fill="Black")

if __name__ == "__main__":
    GUI.Tester()