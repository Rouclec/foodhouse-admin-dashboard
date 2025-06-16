import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import CategoriesPage from "@/app/dashboard/categories/page"
import jest from "jest" // Import jest to fix the undeclared variable error

// Mock the toast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe("CategoriesPage", () => {
  it("renders categories page", () => {
    render(<CategoriesPage />)

    expect(screen.getByText("Product Categories")).toBeInTheDocument()
    expect(screen.getByText("Add Category")).toBeInTheDocument()
    expect(screen.getByText("Vegetables")).toBeInTheDocument()
    expect(screen.getByText("Fruits")).toBeInTheDocument()
  })

  it("opens create category dialog", () => {
    render(<CategoriesPage />)

    const addButton = screen.getByText("Add Category")
    fireEvent.click(addButton)

    expect(screen.getByText("Create New Category")).toBeInTheDocument()
    expect(screen.getByLabelText("Category Name")).toBeInTheDocument()
  })

  it("generates slug from category name", async () => {
    render(<CategoriesPage />)

    const addButton = screen.getByText("Add Category")
    fireEvent.click(addButton)

    const nameInput = screen.getByLabelText("Category Name")
    fireEvent.change(nameInput, { target: { value: "Fresh Herbs & Spices" } })

    await waitFor(() => {
      expect(screen.getByText("fresh-herbs-spices")).toBeInTheDocument()
    })
  })

  it("creates new category", async () => {
    render(<CategoriesPage />)

    const addButton = screen.getByText("Add Category")
    fireEvent.click(addButton)

    const nameInput = screen.getByLabelText("Category Name")
    const submitButton = screen.getByText("Create Category")

    fireEvent.change(nameInput, { target: { value: "Test Category" } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText("Test Category")).toBeInTheDocument()
    })
  })
})
