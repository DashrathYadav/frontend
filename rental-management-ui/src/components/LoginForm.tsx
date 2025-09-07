import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "./Button";
import { Input } from "./Input";
import { Label } from "./Label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./Card";
import { useAuth } from "../contexts/AuthContext";
import { USER_ROLES, type UserRole } from "../constants";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "./Select";

// Form validation schema
const loginSchema = z.object({
    loginId: z.string().min(1, "Login ID is required"),
    password: z.string().min(1, "Password is required"),
    role: z.enum([USER_ROLES.ADMIN, USER_ROLES.OWNER, USER_ROLES.TENANT]),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Get the intended destination from location state, or default to dashboard
    const from = (location.state as any)?.from?.pathname || "/dashboard";

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });
    const selectedRole = watch("role");

    const onFormSubmit = async (data: LoginFormData) => {
        setError(null);

        try {
            const success = await login(data.loginId, data.password, data.role);

            if (success) {
                // Redirect to the intended page or dashboard
                navigate(from, { replace: true });
            } else {
                setError("Invalid login ID, password, or role. Please try again.");
            }
        } catch (err) {
            setError("Login failed. Please try again.");
        }
    };

    return (
        <Card className="w-full">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
                <CardDescription className="text-center">
                    Enter your credentials to access your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            onValueChange={(value: UserRole) => setValue("role", value, { shouldValidate: true })}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Role</SelectLabel>
                                    <SelectItem value={USER_ROLES.ADMIN}>{USER_ROLES.ADMIN}</SelectItem>
                                    <SelectItem value={USER_ROLES.OWNER}>{USER_ROLES.OWNER}</SelectItem>
                                    <SelectItem value={USER_ROLES.TENANT}>{USER_ROLES.TENANT}</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        {errors.role && (
                            <p className="text-sm text-red-500">{errors.role.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="loginId">Login ID</Label>
                        <Input
                            id="loginId"
                            type="text"
                            placeholder="Enter your login ID"
                            {...register("loginId")}
                            className={errors.loginId ? "border-red-500" : ""}
                        />
                        {errors.loginId && (
                            <p className="text-sm text-red-500">{errors.loginId.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                {...register("password")}
                                className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    {error && (
                        <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading || !selectedRole}>
                        {loading ? "Logging in..." : "Login"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-center text-gray-600">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-primary hover:underline">
                        Sign up
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
} 