class Solution {
    // stones = 징검다리에 놓은 돌들에 적힌 숫자
    // k = 건너뛸 수 있는 디딤돌 최대 칸수
    public int solution(int[] stones, int k) {
        int left = 1;
        int right = 0;
        for(int stone : stones) {
            right = Math.max(stone, right);
        }
        int answer = 0;

        while (left <= right) {
            int mid = (left + right) / 2;

            boolean canCross = true;
            int count = 0;
            for(int stone : stones) {
                if(stone - (mid-1) <= 0) {
                    count++;
                    if (count >= k) canCross = false;
                } else {
                    count = 0;
                }
            }

            if (canCross) {
                answer = mid;
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return answer;
    }
}