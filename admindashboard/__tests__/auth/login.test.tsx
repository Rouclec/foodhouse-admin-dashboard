import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import LoginPage from "@/app/auth/login/page"
import { useRouter } from "next/navigation"
import jest from "jest" // Import jest to declare it

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

// Mock the toast hook
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

describe("LoginPage", () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("renders login form", () => {
    render(<LoginPage />)

    expect(screen.getByText("FoodHouse Admin")).toBeInTheDocument()
    expect(screen.getByLabelText("Email")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
  })

  it("shows validation errors for empty fields", async () => {
    render(<LoginPage />)

    const submitButton = screen.getByRole("button", { name: /sign in/i })
    fireEvent.click(submitButton)

    // HTML5 validation should prevent submission
    const emailInput = screen.getByLabelText("Email")
    expect(emailInput).toBeInvalid()
  })

  it("handles successful login", async () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText("Email")
    const passwordInput = screen.getByLabelText("Password")
    const submitButton = screen.getByRole("button", { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: "admin@foodhouse.com" } })
    fireEvent.change(passwordInput, { target: { value: "admin123" } })
    fireEvent.click(submitButton)

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard")
      },
      { timeout: 2000 },
    )
  })

  it("shows error for invalid credentials", async () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText("Email")
    const passwordInput = screen.getByLabelText("Password")
    const submitButton = screen.getByRole("button", { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: "wrong@email.com" } })
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } })
    fireEvent.click(submitButton)

    await waitFor(
      () => {
        expect(screen.getByText("Invalid email or password")).toBeInTheDocument()
      },
      { timeout: 2000 },
    )
  })
})
